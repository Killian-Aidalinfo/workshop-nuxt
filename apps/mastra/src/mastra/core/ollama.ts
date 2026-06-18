import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { Agent } from 'undici';

const TIMEOUT_MS = 5 * 60 * 1000;

const dispatcher = new Agent({
  connect: { timeout: TIMEOUT_MS },
});

export const ollama = createOpenAICompatible({
  name: 'ollama',
  baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
  apiKey: 'ollama',
  fetch: (url, options) =>
    fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS), dispatcher } as RequestInit),
  supportsStructuredOutputs: true,
});
