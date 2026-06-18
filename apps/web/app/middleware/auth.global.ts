export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login', '/register']
  if (publicRoutes.includes(to.path)) return

  const { data } = await useFetch('/api/auth/get-session', {
    headers: useRequestHeaders(['cookie']),
  })

  if (!(data.value as { user?: unknown } | null)?.user) {
    return navigateTo('/login')
  }
})
