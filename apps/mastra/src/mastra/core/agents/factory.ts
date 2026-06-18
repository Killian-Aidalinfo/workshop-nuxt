import { Agent } from '@mastra/core/agent';
import { ollama } from '../ollama';
import { scaleway } from '../scaleway';

export type Provider = 'scaleway' | 'ollama';

const OLLAMA_VISION_MODEL = 'minicpm-v4.5:8b';

const CLASSIFICATION_INSTRUCTIONS =
  'Your goal: Classify the documents by category and tell us whether it is an ID card, an invoice, a delivery slip, or an image of a barcode.';

const OCR_INSTRUCTIONS = `You are an expert document analysis AI with advanced vision capabilities.

Your goal is to extract ALL information visible in the document with maximum accuracy and completeness. Leave nothing out.

For every document you receive:
- Read every piece of text, number, date, and code present
- Identify the document type (invoice, ID card, delivery slip, receipt, contract, barcode, etc.)
- Extract structured fields relevant to that document type (names, addresses, amounts, dates, reference numbers, VAT numbers, IBAN, barcodes, serial numbers, etc.)
- Capture any tables, line items, or lists in full
- Note any stamps, signatures, or handwritten annotations
- Flag any fields that are partially illegible or ambiguous

Return data in a structured format. Be exhaustive — missing a field is worse than including an uncertain one. When uncertain, include the value and mark it with a low confidence score.`;

export function createClassificationAgent(provider: Provider) {
  const model =
    provider === 'ollama'
      ? ollama(OLLAMA_VISION_MODEL)
      : scaleway('qwen3.6-35b-a3b');

  return new Agent({
    id: 'classification-agent',
    name: 'Classification Agent',
    instructions: CLASSIFICATION_INSTRUCTIONS,
    model,
  });
}

export function createOcrAgent(provider: Provider) {
  const model =
    provider === 'ollama'
      ? ollama(OLLAMA_VISION_MODEL)
      : scaleway('qwen3.6-35b-a3b');

  return new Agent({
    id: 'ocr-agent',
    name: 'OCR Agent',
    instructions: OCR_INSTRUCTIONS,
    model,
  });
}
