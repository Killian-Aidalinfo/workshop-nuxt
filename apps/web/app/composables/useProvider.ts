export type Provider = 'scaleway' | 'ollama'

export const PROVIDERS: Provider[] = ['scaleway', 'ollama']
const STORAGE_KEY = 'docextract-provider'

function isProvider(value: unknown): value is Provider {
  return value === 'scaleway' || value === 'ollama'
}

export function useProvider() {
  // Provider utilisé pour une extraction simple (hors A/B).
  const provider = useState<Provider>('provider', () => 'scaleway')
  // Restaure le choix sauvegardé une seule fois, au premier appel côté client.
  const restored = useState<boolean>('provider-restored', () => false)

  if (import.meta.client && !restored.value) {
    restored.value = true
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isProvider(stored)) provider.value = stored
  }

  function setProvider(value: Provider) {
    provider.value = value
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, value)
    }
  }

  return { provider, setProvider, isProvider }
}
