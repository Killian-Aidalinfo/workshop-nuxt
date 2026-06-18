import { updateDocumentStatus } from './documents'

export async function extractTextFromDocument(
  documentId: string,
  _filename: string,
  _mimeType: string,
): Promise<void> {
  await updateDocumentStatus(documentId, 'processing')
  await new Promise((resolve) => setTimeout(resolve, 500))
  await updateDocumentStatus(
    documentId,
    'done',
    '[Extraction IA non configurée — ajoutez OPENAI_API_KEY dans .env]',
  )
}
