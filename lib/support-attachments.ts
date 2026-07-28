// Adjuntos del chat de soporte — límites y validación según el contrato del
// socket de MoP (MoP-Socket-Adjuntos-BotonRojo.pdf).

export type AttachmentType = 'image' | 'file'

/** Adjunto ya persistido / recibido: siempre una URL pública. */
export interface SupportAttachment {
  type: AttachmentType
  url: string
  mime?: string
  filename?: string
}

/** Adjunto que sube el cliente: base64 crudo, sin el prefijo `data:...;base64,`. */
export interface UploadAttachment {
  type: AttachmentType
  data: string
  mime: string
  filename: string
}

/** Hasta 10 adjuntos por mensaje. */
export const MAX_ATTACHMENTS = 10

/**
 * El base64 viaja dentro del evento por el bus de mensajes de MoP, que tope en
 * 10 MB. Nos quedamos bien por debajo.
 */
export const MAX_ATTACHMENT_BYTES = 6 * 1024 * 1024

/** Mismo tope, pero sumando todos los adjuntos de un mismo mensaje. */
export const MAX_TOTAL_BYTES = 6 * 1024 * 1024

export const MAX_TEXT_LENGTH = 8000

/** Texto que mandamos cuando el mensaje es solo archivo (MoP exige mín. 1 caracter). */
export const ATTACHMENT_ONLY_TEXT = '[archivo adjunto]'

export const ALLOWED_MIME_TYPES: Record<string, AttachmentType> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'application/pdf': 'file',
}

export const ACCEPT_ATTR = Object.keys(ALLOWED_MIME_TYPES).join(',')

export function typeForMime(mime: string): AttachmentType {
  return ALLOWED_MIME_TYPES[mime] ?? 'file'
}

/** Bytes reales que representa una cadena base64. */
export function base64ByteLength(base64: string): number {
  const clean = base64.replace(/=+$/, '')
  return Math.floor((clean.length * 3) / 4)
}

function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'archivo'
  return base.replace(/[^\w.\- ]+/g, '_').slice(0, 120) || 'archivo'
}

export type ValidationResult =
  | { ok: true; attachments: UploadAttachment[] }
  | { ok: false; error: string }

/** Valida y normaliza los adjuntos que llegan desde el cliente. */
export function validateUploads(raw: unknown): ValidationResult {
  if (raw == null) return { ok: true, attachments: [] }
  if (!Array.isArray(raw)) return { ok: false, error: 'attachments debe ser un array' }
  if (raw.length > MAX_ATTACHMENTS) {
    return { ok: false, error: `Máximo ${MAX_ATTACHMENTS} adjuntos por mensaje` }
  }

  const attachments: UploadAttachment[] = []
  let totalBytes = 0

  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      return { ok: false, error: 'Adjunto inválido' }
    }
    const { data, mime, filename } = item as Record<string, unknown>

    if (typeof mime !== 'string' || !(mime in ALLOWED_MIME_TYPES)) {
      return { ok: false, error: `Tipo de archivo no permitido: ${String(mime)}` }
    }
    if (typeof data !== 'string' || data.length === 0) {
      return { ok: false, error: 'El adjunto no tiene contenido' }
    }
    // El contrato pide base64 crudo — toleramos que llegue con data URI.
    const base64 = data.includes(',') && data.startsWith('data:') ? data.slice(data.indexOf(',') + 1) : data
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
      return { ok: false, error: 'El adjunto no es base64 válido' }
    }
    const bytes = base64ByteLength(base64)
    if (bytes > MAX_ATTACHMENT_BYTES) {
      return {
        ok: false,
        error: `Cada archivo debe pesar menos de ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)} MB`,
      }
    }
    totalBytes += bytes
    if (totalBytes > MAX_TOTAL_BYTES) {
      return {
        ok: false,
        error: `Los adjuntos suman más de ${Math.round(MAX_TOTAL_BYTES / 1024 / 1024)} MB`,
      }
    }

    attachments.push({
      type: typeForMime(mime),
      data: base64,
      mime,
      filename: sanitizeFilename(typeof filename === 'string' ? filename : 'archivo'),
    })
  }

  return { ok: true, attachments }
}

/** Normaliza los adjuntos que llegan de MoP en `mop.message.outbound/v1`. */
export function parseIncomingAttachments(raw: unknown): SupportAttachment[] {
  if (!Array.isArray(raw)) return []

  const out: SupportAttachment[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const { type, url, mime, filename, caption } = item as Record<string, unknown>
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) continue

    const mimeStr = typeof mime === 'string' ? mime : undefined
    // MoP manda `caption` (ej. "Presupuesto"), no `filename`.
    const name =
      typeof filename === 'string' ? filename : typeof caption === 'string' ? caption : undefined

    out.push({
      type: type === 'image' ? 'image' : type === 'file' ? 'file' : mimeStr ? typeForMime(mimeStr) : 'file',
      url,
      mime: mimeStr,
      filename: name,
    })
  }
  return out
}
