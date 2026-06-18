import { createReadStream, existsSync } from 'fs'
import { join, basename } from 'path'

export default defineEventHandler((event) => {
  const pathParam = getRouterParam(event, 'path')
  if (!pathParam) throw createError({ statusCode: 400 })

  const filename = basename(pathParam)
  const filepath = join(process.cwd(), 'uploads', filename)

  if (!existsSync(filepath)) {
    throw createError({ statusCode: 404, statusMessage: 'Fichier non trouvé' })
  }

  return sendStream(event, createReadStream(filepath))
})
