import type { Page } from '@playwright/test'

/**
 * Logs in via the UI form, which calls apiClient.login() → sets the iron-session
 * cookie AND calls apiClient.setSessionUser() (in-memory) so the layout's client-side
 * guard passes. This is the canonical approach now that api-client.ts is the real fetch
 * client.
 *
 * Name kept as loginViaApi for backward compat — internally it now uses the form to
 * ensure both the cookie AND the in-memory sessionUser are set correctly.
 */
export async function loginViaApi(page: Page, email: string, password = 'demo2024') {
  await page.goto('/login')
  await page.waitForSelector('#email', { timeout: 10_000 })
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  // The login page handler calls apiClient.setSessionUser + router.push('/dashboard')
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
}

/**
 * Logs in via the UI form. Alias kept for semantic clarity in login-specific tests.
 */
export async function loginViaForm(page: Page, email: string, password = 'demo2024') {
  await page.goto('/login')
  await page.waitForSelector('#email', { timeout: 10_000 })
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
}

/** Login as radiologist (rad1@demo.pl) */
export async function loginAsRadiologist(page: Page) {
  return loginViaApi(page, 'rad1@demo.pl')
}

/** Login as doctor (doc1@demo.pl) */
export async function loginAsDoctor(page: Page) {
  return loginViaApi(page, 'doc1@demo.pl')
}
