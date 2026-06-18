import { test, expect } from '@playwright/test'
import { randomUUID } from 'crypto'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

const newEmail = () => `viewer-${randomUUID()}@example.com`
const password = 'TestPass123!'

const PNG_BYTES = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6260000000000200e221bc330000000049454e44ae426082',
  'hex',
)

async function registerAndUpload(page: import('@playwright/test').Page) {
  const userEmail = newEmail()
  await page.goto('/register')
  await page.fill('[data-testid="register-name"]', 'Viewer Tester')
  await page.fill('[data-testid="register-email"]', userEmail)
  await page.fill('[data-testid="register-password"]', password)
  await page.click('[data-testid="register-submit"]')
  await page.waitForURL('/', { timeout: 10000 })

  const pngPath = join('/tmp', `viewer-${randomUUID()}.png`)
  writeFileSync(pngPath, PNG_BYTES)

  try {
    await page.click('[data-testid="upload-open-btn-empty"]')
    const fileInput = page.locator('[data-testid="upload-input"]')
    await fileInput.setInputFiles(pngPath)
    await expect(page.locator('[data-testid="upload-modal"]')).not.toBeVisible({ timeout: 10000 })
  } finally {
    unlinkSync(pngPath)
  }
}

test.describe('Document Viewer', () => {
  test('shows document preview and extracted text panel after upload', async ({ page }) => {
    await registerAndUpload(page)
    await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="extracted-text-panel"]')).toBeVisible()
  })

  test('shows document name in header after selection', async ({ page }) => {
    await registerAndUpload(page)
    await expect(page.locator('[data-testid="selected-doc-name"]')).toBeVisible()
  })

  test('copy button appears when extraction is done', async ({ page }) => {
    await registerAndUpload(page)
    await expect(
      page.locator('[data-testid^="doc-status-"]').filter({ hasText: '[OK]' }),
    ).toBeVisible({ timeout: 30000 })
    await expect(page.locator('[data-testid="copy-text-btn"]')).toBeVisible()
  })

  test('copy button writes text to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await registerAndUpload(page)

    await expect(
      page.locator('[data-testid^="doc-status-"]').filter({ hasText: '[OK]' }),
    ).toBeVisible({ timeout: 30000 })

    await page.click('[data-testid="copy-text-btn"]')
    await expect(page.locator('[data-testid="copy-text-btn"]')).toContainText('copied', {
      timeout: 3000,
    })
  })
})
