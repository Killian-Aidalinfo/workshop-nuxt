export type DocumentStatus = 'pending' | 'processing' | 'done' | 'error'

export interface Document {
  id: string
  userId: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  status: DocumentStatus
  extractedText: string | null
  extractedData: unknown
  createdAt: string
  updatedAt: string
}

export function useDocuments() {
  const documents = useState<Document[]>('documents', () => [])
  const selectedDocument = useState<Document | null>('selectedDocument', () => null)
  const loading = ref(false)
  const toast = useToast()
  const { provider } = useProvider()

  async function fetchDocuments(): Promise<void> {
    loading.value = true
    try {
      const data = await $fetch<{ documents: Document[] }>('/api/documents')
      documents.value = data.documents
    } finally {
      loading.value = false
    }
  }

  async function uploadDocument(file: File): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('provider', provider.value)

    const data = await $fetch<{ document: Document }>('/api/documents/upload', {
      method: 'POST',
      body: formData,
    })

    documents.value.unshift(data.document)
    selectDocument(data.document)
    pollDocument(data.document.id)
    toast.add({ title: 'Upload réussi', color: 'success' })
  }

  function selectDocument(doc: Document): void {
    selectedDocument.value = doc
  }

  async function deleteDocument(id: string): Promise<void> {
    await $fetch(`/api/documents/${id}`, { method: 'DELETE' })
    documents.value = documents.value.filter((d) => d.id !== id)
    if (selectedDocument.value?.id === id) {
      selectedDocument.value = documents.value[0] ?? null
    }
    toast.add({ title: 'Document supprimé', color: 'success' })
  }

  async function retryExtraction(id: string): Promise<void> {
    const data = await $fetch<{ document: Document }>(`/api/documents/${id}/extract`, {
      method: 'POST',
      body: { provider: provider.value },
    })
    if (data.document) {
      updateDocumentInList(data.document)
      pollDocument(id)
    }
  }

  function pollDocument(id: string): void {
    const interval = setInterval(async () => {
      try {
        const data = await $fetch<{ document: Document }>(`/api/documents/${id}`)
        updateDocumentInList(data.document)
        if (data.document.status === 'done' || data.document.status === 'error') {
          clearInterval(interval)
        }
      } catch {
        clearInterval(interval)
      }
    }, 2000)
  }

  function updateDocumentInList(updated: Document): void {
    const idx = documents.value.findIndex((d) => d.id === updated.id)
    if (idx !== -1) documents.value[idx] = updated
    if (selectedDocument.value?.id === updated.id) selectedDocument.value = updated
  }

  return {
    documents,
    selectedDocument,
    loading,
    fetchDocuments,
    uploadDocument,
    selectDocument,
    deleteDocument,
    retryExtraction,
    pollDocument,
  }
}
