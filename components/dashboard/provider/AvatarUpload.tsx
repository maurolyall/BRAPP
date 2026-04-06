'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Cropper, { Area } from 'react-easy-crop'
import { createClient } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/ToastProvider'

interface Props {
  userId: string
  avatarUrl: string | null
}

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = src
  })
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 400
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 400, 400)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/webp', 0.92))
}

export default function AvatarUpload({ userId, avatarUrl: initialUrl }: Props) {
  const { show } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(initialUrl)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result as string)
    reader.readAsDataURL(file)
    // reset input so same file can be selected again
    e.target.value = ''
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setUploading(true)
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      const supabase = createClient()
      const path = `${userId}/avatar.webp`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/webp' })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${data.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', userId)

      if (updateError) throw updateError

      setAvatarUrl(url)
      setImageSrc(null)
      show('Foto actualizada')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Error desconocido'
      show(`Error: ${msg}`, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setImageSrc(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  return (
    <>
      {/* Avatar card */}
      <div
        className="rounded-2xl p-5 flex flex-col items-center gap-3"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
      >
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative group"
          aria-label="Cambiar foto de perfil"
        >
          <div
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: '#f0f0f0', border: '3px solid var(--bg-body)' }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
          {/* edit overlay */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        </button>

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Tocá la foto para cambiarla
        </p>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      {/* Crop modal */}
      {imageSrc && isMounted && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#000' }}>
          {/* Cropper area */}
          <div className="relative flex-1">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Zoom slider */}
          <div className="px-6 py-4" style={{ backgroundColor: '#111' }}>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-red-600"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 pb-8 pt-2" style={{ backgroundColor: '#111' }}>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-3 rounded-full text-sm font-semibold"
              style={{ backgroundColor: '#222', color: '#fff' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={uploading}
              className="flex-1 py-3 rounded-full text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
            >
              {uploading ? 'Subiendo...' : 'Usar foto'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
