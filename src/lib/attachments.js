export const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8MB per file (Gemini inline data limit is generous, this keeps requests snappy)
export const MAX_ATTACHMENTS = 4

export const ACCEPTED_TYPES = [
  'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
  'application/pdf', 'text/plain', 'text/markdown', 'text/csv', 'application/json',
]

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // reader.result looks like "data:<mime>;base64,<data>" — strip the prefix
      const base64 = String(reader.result).split(',')[1] || ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function filesToAttachments(files) {
  const accepted = []
  const rejected = []
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) { rejected.push({ file, reason: 'terlalu besar (maks 8MB)' }); continue }
    if (!ACCEPTED_TYPES.includes(file.type)) { rejected.push({ file, reason: 'tipe file tidak didukung' }); continue }
    const data = await fileToBase64(file)
    accepted.push({ name: file.name, mimeType: file.type, size: file.size, data })
  }
  return { accepted, rejected }
}

export function humanFileSize(bytes) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB']
  let i = 0, n = bytes
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}
