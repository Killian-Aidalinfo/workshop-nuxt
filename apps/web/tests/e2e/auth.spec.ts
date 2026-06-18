import { test, expect } from '@playwright/test'
import { randomUUID } from 'crypto'

const newEmail = () => `test-${randomUUID()}@example.com`
const password = 'TestPass123!'

test.describe('Authentication', () => {
  test('redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })

  test('registers a new user and redirects to home', async ({ page }) => {
    await page.goto('/register')
    await page.fill('[data-testid="register-name"]', 'Test User')
    await page.fill('[data-testid="register-email"]', newEmail())
    await page.fill('[data-testid="register-password"]', password)
    await page.click('[data-testid="register-submit"]')
    await expect(page).toHaveURL('/', { timeout: 10000 })
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
  })

  test('logs in with valid credentials and redirects to home', async ({ page }) => {
    const userEmail = newEmail()

    await page.goto('/register')
    await page.fill('[data-testid="register-name"]', 'Test User')
    await page.fill('[data-testid="register-email"]', userEmail)
    await page.fill('[data-testid="register-password"]', password)
    await page.click('[data-testid="register-submit"]')
    await page.waitForURL('/')

    await page.click('[data-testid="sign-out-btn"]')
    await expect(page).toHaveURL('/login')

    await page.fill('[data-testid="login-email"]', userEmail)
    await page.fill('[data-testid="login-password"]', password)
    await page.click('[data-testid="login-submit"]')
    await expect(page).toHaveURL('/', { timeout: 10000 })
  })

  test('shows error with wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="login-email"]', 'nobody@example.com')
    await page.fill('[data-testid="login-password"]', 'wrongpass')
    await page.click('[data-testid="login-submit"]')
    await expect(page).toHaveURL('/login')
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible({ timeout: 5000 })
  })

  test('signs out and redirects to /login', async ({ page }) => {
    const userEmail = newEmail()
    await page.goto('/register')
    await page.fill('[data-testid="register-name"]', 'Test User')
    await page.fill('[data-testid="register-email"]', userEmail)
    await page.fill('[data-testid="register-password"]', password)
    await page.click('[data-testid="register-submit"]')
    await page.waitForURL('/')

    await page.click('[data-testid="sign-out-btn"]')
    await expect(page).toHaveURL('/login')
  })
})
