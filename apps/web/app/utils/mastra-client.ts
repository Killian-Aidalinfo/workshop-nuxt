import { MastraClient } from '@mastra/client-js'

const config = useRuntimeConfig()

export const mastraClient = new MastraClient({
  baseUrl: config.public.mastraUrl,
})
