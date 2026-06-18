import { auth } from '~/server/utils/auth'
import {
  isAllowedMimeType,
  isFileSizeValid,
  generateFilename,
  saveFile,
  MAX_FILE_SIZE,
} from '~/server/utils/storage'
import { createDocument } from '~/server/utils/documents'
import { extractTextFromDocument } from '~/server/utils/extraction'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Non autorisé' })
  }

  const formData = await readMultipartFormData(event)
  const filePart = formData?.find((f) => f.name === 'file')

  if (!filePart?.data || !filePart.filename) {
    throw createError({ statusCode: 400, statusMessage: 'Aucun fichier fourni' })
  }

  const mimeType = filePart.type ?? 'application/octet-stream'

  if (!isAllowedMimeType(mimeType)) {
    throw createError({
      statusCode: 415,
      statusMessage: 'Type de fichier non supporté. Formats acceptés : PDF, PNG, JPG, WEBP, TIFF',
    })
  }

  if (!isFileSizeValid(filePart.data.length)) {
    throw createError({
      statusCode: 413,
      statusMessage: `Fichier trop volumineux. Maximum : ${MAX_FILE_SIZE / 1024 / 1024} Mo`,
    })
  }

  const filename = generateFilename(filePart.filename, mimeType)
  await saveFile(filename, filePart.data)

  const document = await createDocument({
    userId: session.user.id,
    filename,
    originalName: filePart.filename,
    mimeType,
    size: filePart.data.length,
  })

  extractTextFromDocument(document.id, filename).catch((err) => {
    console.error(`Extraction failed for document ${document.id}:`, err)
  })

  return { document }
})
