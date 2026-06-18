import { join } from 'path'
import { mkdir, writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { randomUUID } from 'crypto'

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/tiff',
] as const

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)
}

export function isFileSizeValid(size: number): boolean {
  return size <= MAX_FILE_SIZE
}

const EXTENSION_MAP: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/tiff': '.tiff',
}

export function generateFilename(originalName: string, mimeType: string): string {
  const ext = EXTENSION_MAP[mimeType] ?? '.bin'
  const safe = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${randomUUID()}-${safe}${ext}`
}

const UPLOADS_DIR = join(process.cwd(), 'uploads')

async function ensureUploadsDir(): Promise<void> {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true })
  }
}

export async function saveFile(filename: string, buffer: Buffer): Promise<string> {
  await ensureUploadsDir()
  const filepath = join(UPLOADS_DIR, filename)
  await writeFile(filepath, buffer)
  return filepath
}

export async function deleteFile(filename: string): Promise<void> {
  const filepath = join(UPLOADS_DIR, filename)
  await unlink(filepath)
}

export function getUploadPath(filename: string): string {
  return join(UPLOADS_DIR, filename)
}
