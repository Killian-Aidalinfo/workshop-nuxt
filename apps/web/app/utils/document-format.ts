import type { Document, DocumentStatus } from '~/composables/useDocuments'

const MONTHS_FR = [
  'jan.', 'fév.', 'mar.', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sep.', 'oct.', 'nov.', 'déc.',
]

/** Extension affichée dans le badge (ex: PDF, JPG, PNG). */
export function docExt(doc: Document): string {
  const fromName = doc.originalName.split('.').pop()
  const raw = fromName || doc.mimeType.split('/').pop() || '?'
  return raw.toUpperCase().slice(0, 4)
}

/** Catégorie de fichier pour le code couleur du badge. */
export function docType(doc: Document): 'pdf' | 'img' {
  return doc.mimeType === 'application/pdf' ? 'pdf' : 'img'
}

/** Date courte façon « 15 jan. 2024 ». */
export function formatDocDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`
}

/** Nombre de « tokens » (approximé par le nombre de mots). */
export function countTokens(text: string | null): number {
  if (!text) return 0
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

export const STATUS_LABEL: Record<DocumentStatus, string> = {
  pending: '[QUE]',
  processing: '[RUN]',
  done: '[OK]',
  error: '[ERR]',
}

export const STATUS_COLOR: Record<DocumentStatus, string> = {
  pending: '#475569',
  processing: '#f59e0b',
  done: '#22c55e',
  error: '#ef4444',
}

export const STATUS_BG: Record<DocumentStatus, string> = {
  pending: 'rgba(71,85,105,0.12)',
  processing: 'rgba(245,158,11,0.12)',
  done: 'rgba(34,197,94,0.12)',
  error: 'rgba(239,68,68,0.12)',
}
