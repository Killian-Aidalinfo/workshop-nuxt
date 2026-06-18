import { prisma } from './prisma'
import type { Document, DocumentStatus } from '@prisma/client'

export type CreateDocumentInput = {
  userId: string
  filename: string
  originalName: string
  mimeType: string
  size: number
}

export async function createDocument(data: CreateDocumentInput): Promise<Document> {
  return prisma.document.create({ data })
}

export async function getDocumentsByUser(userId: string): Promise<Document[]> {
  return prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getDocumentById(id: string, userId: string): Promise<Document | null> {
  return prisma.document.findFirst({ where: { id, userId } })
}

export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus,
  extractedText?: string,
): Promise<Document> {
  return prisma.document.update({
    where: { id },
    data: {
      status,
      ...(extractedText !== undefined ? { extractedText } : {}),
    },
  })
}

export async function deleteDocument(id: string, userId: string): Promise<Document> {
  return prisma.document.delete({ where: { id, userId } })
}
