export interface AbResult {
  scaleway: string | null
  ollama: string | null
  isLoading: boolean
  error: string | null
}

export function useAbTest() {
  const abMode = useState<boolean>('abMode', () => false)
  const abResults = useState<Record<string, AbResult>>('abResults', () => ({}))
  const toast = useToast()

  function toggleAbMode() {
    abMode.value = !abMode.value
  }

  async function runComparison(documentId: string) {
    abResults.value[documentId] = { scaleway: null, ollama: null, isLoading: true, error: null }

    try {
      const data = await $fetch<{ scaleway: string; ollama: string }>(
        `/api/documents/${documentId}/compare`,
        { method: 'POST' },
      )
      abResults.value[documentId] = { ...data, isLoading: false, error: null }
    } catch {
      abResults.value[documentId] = { scaleway: null, ollama: null, isLoading: false, error: 'Comparaison échouée' }
      toast.add({ title: 'Comparaison échouée', color: 'error' })
    }
  }

  function getResult(documentId: string): AbResult | null {
    return abResults.value[documentId] ?? null
  }

  return { abMode, toggleAbMode, runComparison, getResult }
}
