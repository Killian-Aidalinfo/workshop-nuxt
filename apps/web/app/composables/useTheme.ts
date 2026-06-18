export type Theme = 'dark' | 'light'

const COOKIE_KEY = 'docextract-theme'
const ONE_YEAR = 60 * 60 * 24 * 365

export function useTheme() {
  // Cookie : persistant + lisible côté SSR (pas de flash au chargement).
  const cookie = useCookie<Theme>(COOKIE_KEY, {
    default: () => 'dark',
    maxAge: ONE_YEAR,
    sameSite: 'lax',
    path: '/',
  })

  // useState : source réactive unique, partagée entre tous les composants.
  const theme = useState<Theme>('theme', () => cookie.value)

  function setTheme(value: Theme) {
    theme.value = value
    cookie.value = value
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggleTheme }
}
