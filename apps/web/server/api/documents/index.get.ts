import { auth } from '~/server/utils/auth'
import { getDocumentsByUser } from '~/server/utils/documents'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Non autorisé' })

  const documents = await getDocumentsByUser(session.user.id)
  return { documents }
})
