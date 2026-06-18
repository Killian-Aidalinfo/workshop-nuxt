import { Agent } from '@mastra/core/agent'
import { scaleway } from '../scaleway'

export const testAgent = new Agent({
  id: 'test-agent',
  name: 'Test Agent',
  instructions: 'You are a helpful assistant.',
  model: scaleway("qwen3.6-35b-a3b"),
})