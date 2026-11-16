import React, { useRef, useState } from 'react'
import { api } from '../../api/index'
import { supabase } from '../../lib/supabase'

/** Shrink big photos in the browser (max 1280px wide, WebP/JPEG) before uploading. */
function resizeImage(file, maxW = 1280) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      const done = (blob) => (blob ? resolve(blob) : reject(new Error('Could not process this image')))
      canvas.toBlob(b => (b && b.type === 'image/webp' ? done(b) : canvas.toBlob(done, 'image/jpeg', 0.86)), 'image/webp', 0.86)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not a readable image')) }
    img.src = url
  })
}

const blobToDataUrl = (blob) => new Promise((res, rej) => {
  const r = new FileReader()
  r.onload = () => res(r.result)
  r.onerror = () => rej(new Error('Could not read the image'))
  r.readAsDataURL(blob)
})

/**
 * Thumbnail picker for the admin panel.
 *  - Upload from the computer → stored in the Supabase "course-thumbnails" bucket (public URL saved on the course)
 *  - …or paste an image URL
 * In demo mode (no Supabase) the image is kept in memory only.
 */
export default function ImageUpload({ value, onChange, nameHint = 'course', label = 'Course thumbnail' }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [broken, setBroken] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) return setError('Please choose an image file (JPG, PNG or WebP).')
    if (file.size > 12 * 1024 * 1024) return setError('That image is over 12 MB. Please choose a smaller one.')
    setBusy(true)
    try {
      const blob = await resizeImage(file)
      if (!supabase) {
        onChange(await blobToDataUrl(blob))   // demo mode: not persisted
      } else {
        const { url, error: upErr } = await api.storage.uploadThumbnail(blob, nameHint)
        if (upErr) {
          const m = upErr.message || ''
          throw new Error(/bucket not found/i.test(m)
            ? 'The "course-thumbnails" storage bucket does not exist yet. Run supabase/migrations/003_subcategories_thumbnails_venues.sql in the Supabase SQL Editor.'
            : /row-level security|not authorized|permission/i.test(m)
              ? 'Upload was refused. Make sure you are signed in as an admin (profiles.role = admin).'
              : m)
        }
        setBroken(false)
        onChange(url)
      }
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <div className="flex gap-4 items-start">
        <div className="w-40 h-24 rounded-xl border border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
          {value && !broken ? (
            <img src={value} alt="Thumbnail preview" onError={() => setBroken(true)} onLoad={() => setBroken(false)} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[11px] text-gray-400 text-center px-2">{value ? 'Image could not be loaded' : 'No image yet'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
              className="btn-secondary !px-4 !py-2 text-xs disabled:opacity-60">
              {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
            </button>
            {value && (
              <button type="button" onClick={() => { onChange(''); setError('') }} className="text-xs text-red-500 font-semibold hover:underline px-2">
                Remove
              </button>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFile} className="hidden" />
          <input
            type="url"
            value={value && !value.startsWith('data:') ? value : ''}
            onChange={e => { setBroken(false); onChange(e.target.value.trim()) }}
            placeholder="…or paste an image URL (https://…)"
            className="input-field !py-2 text-xs w-full"
          />
          <p className="text-[11px] text-gray-400">Best at 16:9 (e.g. 1280×720). Large photos are shrunk automatically.</p>
          {!supabase && <p className="text-[11px] text-amber-600">Demo mode: images are not saved. Connect Supabase to store them.</p>}
          {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
        </div>
      </div>
    </div>
  )
}
