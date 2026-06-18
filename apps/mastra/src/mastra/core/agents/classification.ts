import { Agent } from '@mastra/core/agent'
import { scaleway } from '../scaleway'

export const classificationAgent = new Agent({
  id: 'classification-agent',
  name: 'Classification Agent',
  instructions: 'Your goal: Classify the documents by category and tell us whether it is an ID card, an invoice, a delivery slip, or an image of a barcode.',
  model: scaleway("qwen3.6-35b-a3b"),
})