import { createReadStream, existsSync } from 'fs'
import { join, basename, extname } from 'path'

const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

export default defineEventHandler((event) => {
  const pathParam = getRouterParam(event, 'path')
  if (!pathParam) throw createError({ statusCode: 400 })

  const filename = basename(pathParam)
  const filepath = join(process.cwd(), 'uploads', filename)

  if (!existsSync(filepath)) {
    throw createError({ statusCode: 404, statusMessage: 'Fichier non trouvé' })
  }

  const ext = extname(filename).toLowerCase()
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'
  setResponseHeader(event, 'Content-Type', contentType)

  return sendStream(event, createReadStream(filepath))
})
