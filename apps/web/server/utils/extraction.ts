import { readFile } from 'fs/promises'
import { getUploadPath } from './storage'
import { updateDocumentStatus } from './documents'

async function extractFromImage(base64: string, mimeType: string): Promise<string> {
  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extrais tout le texte de ce document. Retourne uniquement le texte extrait, sans commentaire ni mise en forme supplémentaire.',
          },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
    max_tokens: 4096,
  })

  return response.choices[0]?.message?.content ?? ''
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return data.text
}

export async function extractTextFromDocument(
  documentId: string,
  filename: string,
  mimeType: string,
): Promise<void> {
  await updateDocumentStatus(documentId, 'processing')

  try {
    const filepath = getUploadPath(filename)
    const buffer = await readFile(filepath)

    let extractedText: string

    if (mimeType === 'application/pdf') {
      extractedText = await extractFromPdf(buffer)
    } else if (process.env.OPENAI_API_KEY) {
      const base64 = buffer.toString('base64')
      extractedText = await extractFromImage(base64, mimeType)
    } else {
      extractedText = '[Clé OPENAI_API_KEY manquante — extraction non disponible pour les images]'
    }

    await updateDocumentStatus(documentId, 'done', extractedText)
  } catch (error) {
    await updateDocumentStatus(documentId, 'error')
    throw error
  }
}
