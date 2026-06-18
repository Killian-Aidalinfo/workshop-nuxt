import { updateDocumentStatus } from './documents'
import { mastraClient } from './mastra-client'

type StepOutput = Record<string, unknown>

function serializeValue(value: unknown, indent = ''): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'oui' : 'non'
  if (Array.isArray(value)) {
    return value
      .map((item, i) => `${indent}  [${i + 1}] ${serializeValue(item, indent + '  ')}`)
      .join('\n')
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => {
        const label = k.replace(/([A-Z])/g, ' $1').trim()
        const formatted = serializeValue(v, indent + '  ')
        return typeof v === 'object' && !Array.isArray(v)
          ? `${indent}${label} :\n${formatted}`
          : `${indent}${label} : ${formatted}`
      })
      .join('\n')
  }
  return String(value)
}

function extractTextFromResult(steps: Record<string, { output?: StepOutput }>): string {
  // Trouver la première step qui n'est pas la classification (step-1)
  const contentStep = Object.entries(steps)
    .filter(([id]) => id !== 'step-1' && id !== 'input')
    .find(([, step]) => step.output && Object.keys(step.output).length > 0)

  if (contentStep) {
    const [, step] = contentStep
    return serializeValue(step.output)
  }

  // Fallback : info de classification depuis step-1
  const classification = steps['step-1']?.output?.typeOfImg as
    | { type: string; confidence: number }
    | undefined
  if (classification) {
    return `Type de document : ${classification.type} (confiance : ${Math.round(classification.confidence * 100)}%)`
  }

  return 'Extraction terminée — aucun contenu structuré trouvé.'
}

export async function extractTextFromDocument(documentId: string, filename: string): Promise<void> {
  await updateDocumentStatus(documentId, 'processing')

  try {
    const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const fileUrl = `${appUrl}/api/files/${filename}`

    const workflow = mastraClient.getWorkflow('test-workflow')
    const run = await workflow.createRun()
    const result = await run.startAsync({ inputData: { urlFile: fileUrl } }) as {
      steps?: Record<string, { output?: StepOutput }>
    }

    const steps = result.steps ?? {}
    const extractedText = extractTextFromResult(steps)
    await updateDocumentStatus(documentId, 'done', extractedText)
  } catch (error) {
    await updateDocumentStatus(documentId, 'error')
    throw error
  }
}
