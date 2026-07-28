// Normalización de teléfonos argentinos a E.164 — el formato que exige MoP
// para `user.phone` (ej. +5491133445566). La app es solo Argentina por ahora.
//
// Reglas de marcación argentina que resolvemos acá:
//   · código de país 54 (con o sin +)
//   · prefijo nacional 0 (ej. 011, 0341) → se descarta
//   · prefijo de móvil 15 después del código de área → se descarta
//   · el 9 de móvil internacional (+549) → lo agregamos nosotros
//
// El número nacional significativo argentino siempre tiene 10 dígitos:
// código de área (2, 3 o 4) + abonado (8, 7 o 6).

const AREA_CODE_LENGTHS = [2, 3, 4]
const NSN_LENGTH = 10

/**
 * Devuelve el teléfono en E.164 (`+549XXXXXXXXXX`) o `null` si no es un
 * número argentino válido.
 *
 * Nota: asumimos móvil (prefijo 9). En Argentina no se puede distinguir un fijo
 * de un móvil por el número una vez que se quitan los marcadores 15/9, y el bot
 * de MoP opera sobre WhatsApp, así que el móvil es el caso que importa.
 */
export function normalizeArPhone(raw: string | null | undefined): string | null {
  if (!raw) return null

  let digits = raw.replace(/\D/g, '')
  if (!digits) return null

  // Código de país. Solo lo sacamos si sobra longitud — hay códigos de área
  // que podrían empezar con 54 en un número ya nacional.
  if (digits.length > NSN_LENGTH && digits.startsWith('54')) {
    digits = digits.slice(2)
  }

  // Prefijo nacional (0341, 011, ...).
  while (digits.length > NSN_LENGTH && digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  // Marcador de móvil internacional: lo re-agregamos al final.
  if (digits.length === NSN_LENGTH + 1 && digits.startsWith('9')) {
    digits = digits.slice(1)
  }

  // Marcador de móvil nacional: el 15 va después del código de área.
  if (digits.length === NSN_LENGTH + 2) {
    for (const len of AREA_CODE_LENGTHS) {
      if (digits.slice(len, len + 2) === '15') {
        digits = digits.slice(0, len) + digits.slice(len + 2)
        break
      }
    }
  }

  if (digits.length !== NSN_LENGTH) return null
  // El código de área nunca empieza con 0 ni con 9.
  if (digits.startsWith('0') || digits.startsWith('9')) return null

  return `+549${digits}`
}

export function isValidArPhone(raw: string | null | undefined): boolean {
  return normalizeArPhone(raw) !== null
}

/**
 * Clave canónica para comparar teléfonos entre sistemas: los 10 dígitos del
 * número nacional significativo (código de área + abonado).
 *
 * Existe porque WhatsApp y MoP no siempre mandan el `9` de móvil argentino —
 * el `wa_id` suele venir como `5411...` mientras que el E.164 es `54911...`.
 * Comparar el string completo fallaría; los últimos 10 dígitos son idénticos
 * en ambas formas.
 *
 *   arPhoneKey('+5491133445566') === arPhoneKey('541133445566')  // '1133445566'
 *
 * En la base hay una columna generada equivalente (`profiles.phone_key`), así
 * que el match se resuelve con un índice en vez de escanear la tabla.
 */
export function arPhoneKey(raw: string | null | undefined): string | null {
  const normalized = normalizeArPhone(raw)
  return normalized ? normalized.slice(-10) : null
}

export const PHONE_PLACEHOLDER = 'Ej: 11 2345 6789'
export const PHONE_HELP = 'Ingresá tu celular con código de área, sin el 0 ni el 15.'
export const PHONE_ERROR = 'Ingresá un celular argentino válido (código de área + número, sin 0 ni 15).'
