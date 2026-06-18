import { describe, it, expect } from 'vitest'
import {
  isAllowedMimeType,
  isFileSizeValid,
  generateFilename,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '~/server/utils/storage'

describe('isAllowedMimeType', () => {
  it('accepts PDF', () => {
    expect(isAllowedMimeType('application/pdf')).toBe(true)
  })

  it('accepts PNG', () => {
    expect(isAllowedMimeType('image/png')).toBe(true)
  })

  it('accepts JPEG', () => {
    expect(isAllowedMimeType('image/jpeg')).toBe(true)
  })

  it('accepts WEBP', () => {
    expect(isAllowedMimeType('image/webp')).toBe(true)
  })

  it('accepts TIFF', () => {
    expect(isAllowedMimeType('image/tiff')).toBe(true)
  })

  it('rejects ZIP', () => {
    expect(isAllowedMimeType('application/zip')).toBe(false)
  })

  it('rejects plain text', () => {
    expect(isAllowedMimeType('text/plain')).toBe(false)
  })
})

describe('isFileSizeValid', () => {
  it('accepts file under 10 MB', () => {
    expect(isFileSizeValid(5 * 1024 * 1024)).toBe(true)
  })

  it('accepts file exactly 10 MB', () => {
    expect(isFileSizeValid(MAX_FILE_SIZE)).toBe(true)
  })

  it('rejects file over 10 MB', () => {
    expect(isFileSizeValid(MAX_FILE_SIZE + 1)).toBe(false)
  })
})

describe('generateFilename', () => {
  it('returns a string with the original extension', () => {
    const name = generateFilename('report.pdf', 'application/pdf')
    expect(name).toMatch(/\.pdf$/)
  })

  it('returns unique names for same input', () => {
    const a = generateFilename('doc.png', 'image/png')
    const b = generateFilename('doc.png', 'image/png')
    expect(a).not.toBe(b)
  })

  it('sanitizes spaces from original name', () => {
    const name = generateFilename('my file.pdf', 'application/pdf')
    expect(name).not.toContain(' ')
  })

  it('sanitizes parentheses from original name', () => {
    const name = generateFilename('my file (1).pdf', 'application/pdf')
    expect(name).not.toContain('(')
  })
})

describe('ALLOWED_MIME_TYPES', () => {
  it('contains exactly 5 types', () => {
    expect(ALLOWED_MIME_TYPES).toHaveLength(5)
  })
})
