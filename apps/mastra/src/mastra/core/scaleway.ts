import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const scaleway = createOpenAICompatible({
  name: 'scaleway',
  apiKey: process.env.SCALEWAY_API_KEY!,
  baseURL: 'https://api.scaleway.ai/v1',
  supportsStructuredOutputs: true,
})

