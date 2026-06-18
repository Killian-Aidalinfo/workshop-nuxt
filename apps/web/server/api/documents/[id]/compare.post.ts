import { auth } from '~/server/utils/auth'
import { getDocumentById } from '~/server/utils/documents'
import { runExtraction } from '~/server/utils/extraction'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Non autorisé' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400 })

  const document = await getDocumentById(id, session.user.id)
  if (!document) throw createError({ statusCode: 404, statusMessage: 'Document non trouvé' })

  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const fileUrl = `${appUrl}/api/files/${document.filename}`

  const [scaleway, ollama] = await Promise.allSettled([
    runExtraction(fileUrl, 'scaleway'),
    runExtraction(fileUrl, 'ollama'),
  ])

  return {
    scaleway: scaleway.status === 'fulfilled' ? scaleway.value.text : `Erreur : ${(scaleway as PromiseRejectedResult).reason}`,
    ollama: ollama.status === 'fulfilled' ? ollama.value.text : `Erreur : ${(ollama as PromiseRejectedResult).reason}`,
  }
})
