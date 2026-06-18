import { PrismaClient } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'

const email = process.env.ADMIN_EMAIL ?? 'admin@docextract.local'
const password = process.env.ADMIN_PASSWORD
const name = process.env.ADMIN_NAME ?? 'Admin'

if (!password) {
  console.error('❌  ADMIN_PASSWORD env var is required')
  process.exit(1)
}

const prisma = new PrismaClient()

async function run() {
  const hashed = await hashPassword(password!)
  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: 'admin' },
    })
    await prisma.account.updateMany({
      where: { userId: existing.id, providerId: 'credential' },
      data: { password: hashed },
    })
    console.log(`✅  Admin mis à jour : ${email}`)
  } else {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        emailVerified: true,
        role: 'admin',
      },
    })
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashed,
      },
    })
    console.log(`✅  Admin créé : ${email}`)
  }

  await prisma.$disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
