import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/server/utils/prisma', () => ({
  prisma: {
    document: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { prisma } from '~/server/utils/prisma'
import {
  createDocument,
  getDocumentsByUser,
  getDocumentById,
  updateDocumentStatus,
  deleteDocument,
} from '~/server/utils/documents'

const mockDoc = {
  id: 'doc-1',
  userId: 'user-1',
  filename: 'uuid-file.pdf',
  originalName: 'file.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  status: 'pending' as const,
  extractedText: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createDocument', () => {
  it('calls prisma.document.create with correct data', async () => {
    vi.mocked(prisma.document.create).mockResolvedValue(mockDoc)
    const input = {
      userId: 'user-1',
      filename: 'uuid-file.pdf',
      originalName: 'file.pdf',
      mimeType: 'application/pdf',
      size: 1024,
    }
    const result = await createDocument(input)
    expect(prisma.document.create).toHaveBeenCalledWith({ data: input })
    expect(result).toBe(mockDoc)
  })
})

describe('getDocumentsByUser', () => {
  it('returns documents ordered by createdAt desc', async () => {
    vi.mocked(prisma.document.findMany).mockResolvedValue([mockDoc])
    const result = await getDocumentsByUser('user-1')
    expect(prisma.document.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    })
    expect(result).toHaveLength(1)
  })
})

describe('getDocumentById', () => {
  it('returns document when found', async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(mockDoc)
    const result = await getDocumentById('doc-1', 'user-1')
    expect(prisma.document.findFirst).toHaveBeenCalledWith({
      where: { id: 'doc-1', userId: 'user-1' },
    })
    expect(result).toBe(mockDoc)
  })

  it('returns null when not found', async () => {
    vi.mocked(prisma.document.findFirst).mockResolvedValue(null)
    const result = await getDocumentById('not-exist', 'user-1')
    expect(result).toBeNull()
  })
})

describe('updateDocumentStatus', () => {
  it('updates status without extractedText', async () => {
    vi.mocked(prisma.document.update).mockResolvedValue({ ...mockDoc, status: 'processing' })
    await updateDocumentStatus('doc-1', 'processing')
    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 'doc-1' },
      data: { status: 'processing' },
    })
  })

  it('updates status with extractedText', async () => {
    vi.mocked(prisma.document.update).mockResolvedValue({ ...mockDoc, status: 'done', extractedText: 'hello' })
    await updateDocumentStatus('doc-1', 'done', 'hello')
    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 'doc-1' },
      data: { status: 'done', extractedText: 'hello' },
    })
  })
})

describe('deleteDocument', () => {
  it('calls prisma.document.delete with id and userId', async () => {
    vi.mocked(prisma.document.delete).mockResolvedValue(mockDoc)
    await deleteDocument('doc-1', 'user-1')
    expect(prisma.document.delete).toHaveBeenCalledWith({
      where: { id: 'doc-1', userId: 'user-1' },
    })
  })
})
