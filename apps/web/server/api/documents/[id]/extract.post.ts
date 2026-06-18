import { auth } from '~/server/utils/auth'
import { getDocumentById, updateDocumentStatus } from '~/server/utils/documents'
import { extractTextFromDocument } from '~/server/utils/extraction'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Non autorisé' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400 })

  const document = await getDocumentById(id, session.user.id)
  if (!document) throw createError({ statusCode: 404, statusMessage: 'Document non trouvé' })

  await updateDocumentStatus(id, 'pending')

  extractTextFromDocument(id, document.filename).catch((err) => {
    console.error(`Re-extraction failed for document ${id}:`, err)
  })

  const updated = await getDocumentById(id, session.user.id)
  return { document: updated }
})
