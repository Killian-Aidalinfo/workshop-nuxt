import { auth } from '~/server/utils/auth'
import { toWebRequest } from 'h3'

export default defineEventHandler((event) => {
  if (
    process.env.DISABLE_REGISTER === 'true' &&
    event.path?.includes('/sign-up/email')
  ) {
    throw createError({ statusCode: 403, statusMessage: 'Registration is disabled' })
  }

  return auth.handler(toWebRequest(event))
})
