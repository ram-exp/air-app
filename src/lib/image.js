import { isSupabaseConfigured, supabase } from './supabase'
import { useAuthStore } from '@/store/useAuthStore'

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Downscales + recompresses an image file via canvas before it's turned into
// a base64 data URL. Local mode stores images as plain string fields inside
// a localStorage-backed collection (see localData.js), which re-serializes
// the *entire* collection on every save — a couple of full-resolution photos
// (often 3-8MB each, ~33% bigger once base64-encoded) will blow past the
// browser's ~5-10MB localStorage quota and make every subsequent save slower
// or fail outright. Capping dimensions/quality keeps each image in the tens
// to low-hundreds of KB, which is what actually needs to be persisted here.
function compressImage(file, { maxDimension = 1000, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height / width) * maxDimension)
          width = maxDimension
        } else {
          width = Math.round((width / height) * maxDimension)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // SVGs and GIFs (animation) shouldn't be flattened to JPEG.
      const keepFormat = file.type === 'image/svg+xml' || file.type === 'image/gif'
      const outputType = keepFormat ? file.type : 'image/jpeg'
      resolve(canvas.toDataURL(outputType, quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not load image for compression'))
    }
    img.src = objectUrl
  })
}

// Returns a usable image URL for the given file: uploads to Supabase Storage
// when connected, otherwise falls back to a resized/compressed inline base64
// data URL stored alongside the record (fine for personal, local-only use).
export async function storeImage(file, pathPrefix = 'covers') {
  if (isSupabaseConfigured && supabase) {
    const uid = useAuthStore.getState().user?.uid || 'guest'
    // Scoped under {uid}/... to match the storage.objects policies — see
    // supabase.sql.
    const path = `${uid}/${pathPrefix}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('uploads').upload(path, file)
    if (error) throw error
    return supabase.storage.from('uploads').getPublicUrl(path).data.publicUrl
  }
  try {
    return await compressImage(file)
  } catch {
    // Fall back to the uncompressed data URL rather than failing the upload
    // entirely (e.g. for image types canvas can't decode).
    return fileToDataUrl(file)
  }
}
