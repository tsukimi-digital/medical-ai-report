import { test, expect } from '@playwright/test'

/**
 * Login flow tests.
 * These tests use the UI form for login-specific flows,
 * and direct API calls for session-related redirect tests.
 */

test.describe('Login flow', () => {
  test('login page renders Sonara branding', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('.brand-name', { timeout: 10_000 })
    const brandText = await page.locator('.brand-name').first().textContent()
    expect(brandText).toContain('Sonara')
  })

  test('login form elements are present', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('#email', { timeout: 10_000 })
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('wrong password → error message visible', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('#email', { timeout: 10_000 })
    await page.fill('#email', 'rad1@demo.pl')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Error banner should appear
    const errorBanner = page.locator('[role="alert"]')
    await expect(errorBanner).toBeVisible({ timeout: 5_000 })
    // Should still be on login page
    expect(page.url()).toContain('/login')
  })

  test('unknown email → error message visible', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('#email', { timeout: 10_000 })
    await page.fill('#email', 'nouser@nowhere.pl')
    await page.fill('#password', 'demo2024')
    await page.click('button[type="submit"]')

    const errorBanner = page.locator('[role="alert"]')
    await expect(errorBanner).toBeVisible({ timeout: 5_000 })
    expect(page.url()).toContain('/login')
  })

  test('accessing /dashboard without session → redirect to /login', async ({ page }) => {
    // Fresh context — no session cookie
    await page.goto('/dashboard')
    // Middleware redirects to /login
    await page.waitForURL('**/login', { timeout: 10_000 })
    expect(page.url()).toContain('/login')
  })

  test('accessing /examination/rad-A without session → redirect to /login', async ({ page }) => {
    await page.goto('/examination/rad-A')
    await page.waitForURL('**/login', { timeout: 10_000 })
    expect(page.url()).toContain('/login')
  })

  test('valid API login → can access /dashboard', async ({ page }) => {
    // Use API login to properly set iron-session cookie
    const resp = await page.request.post('/api/auth/login', {
      data: { email: 'rad1@demo.pl', password: 'demo2024' },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(resp.ok()).toBeTruthy()

    await page.goto('/dashboard')
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    expect(page.url()).toContain('/dashboard')
  })

  test('quick access buttons pre-fill email', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('.panel', { timeout: 10_000 })

    // Click on doctor user quick access button
    const doctorBtn = page.locator('.panel').filter({ hasText: 'doc1@demo.pl' }).first()
    await doctorBtn.click()

    const emailValue = await page.locator('#email').inputValue()
    expect(emailValue).toBe('doc1@demo.pl')
  })
})
