import { test, expect } from '@playwright/test'
import { randomUUID } from 'crypto'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

const newEmail = () => `upload-${randomUUID()}@example.com`
const password = 'TestPass123!'

// Minimal valid 1x1 transparent PNG
const PNG_BYTES = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6260000000000200e221bc330000000049454e44ae426082',
  'hex',
)

async function registerAndLogin(page: import('@playwright/test').Page, email: string) {
  await page.goto('/register')
  await page.fill('[data-testid="register-name"]', 'Upload Tester')
  await page.fill('[data-testid="register-email"]', email)
  await page.fill('[data-testid="register-password"]', password)
  await page.click('[data-testid="register-submit"]')
  await page.waitForURL('/', { timeout: 10000 })
}

test.describe('Document Upload', () => {
  test('uploads a PNG image successfully', async ({ page }) => {
    await registerAndLogin(page, newEmail())

    const pngPath = join('/tmp', `test-${randomUUID()}.png`)
    writeFileSync(pngPath, PNG_BYTES)

    try {
      await page.click('[data-testid="upload-open-btn-empty"]')
      await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()

      const fileInput = page.locator('[data-testid="upload-input"]')
      await fileInput.setInputFiles(pngPath)

      await expect(page.locator('[data-testid="upload-modal"]')).not.toBeVisible({ timeout: 10000 })
      await expect(page.locator('[data-testid^="doc-item-"]').first()).toBeVisible()
    } finally {
      unlinkSync(pngPath)
    }
  })

  test('shows error when uploading unsupported file type', async ({ page }) => {
    await registerAndLogin(page, newEmail())

    const txtPath = join('/tmp', `test-${randomUUID()}.txt`)
    writeFileSync(txtPath, 'hello world')

    try {
      await page.click('[data-testid="upload-open-btn-empty"]')
      const fileInput = page.locator('[data-testid="upload-input"]')
      await fileInput.setInputFiles(txtPath)
      await expect(page.locator('[data-testid="upload-error"]')).toBeVisible({ timeout: 5000 })
    } finally {
      unlinkSync(txtPath)
    }
  })
})
