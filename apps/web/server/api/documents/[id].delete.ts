import { auth } from '~/server/utils/auth'
import { getDocumentById, deleteDocument } from '~/server/utils/documents'
import { deleteFile } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Non autorisé' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400 })

  const document = await getDocumentById(id, session.user.id)
  if (!document) throw createError({ statusCode: 404, statusMessage: 'Document non trouvé' })

  await deleteFile(document.filename).catch(() => {
    // File may already be missing — continue with DB deletion
  })
  await deleteDocument(id, session.user.id)

  return { success: true }
})
