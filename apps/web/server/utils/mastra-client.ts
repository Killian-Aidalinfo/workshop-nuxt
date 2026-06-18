import { MastraClient } from '@mastra/client-js'

let client: MastraClient | null = null

/**
 * Client Mastra (serveur). La baseUrl provient du runtimeConfig Nuxt
 * (`mastraUrl`), surchargeable par la variable d'env `NUXT_MASTRA_URL`.
 */
export function getMastraClient(): MastraClient {
  if (!client) {
    const { mastraUrl } = useRuntimeConfig()
    client = new MastraClient({ baseUrl: mastraUrl })
  }
  return client
}
