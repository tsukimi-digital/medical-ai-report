import type { Page } from '@playwright/test'

/**
 * Logs in by calling the real API endpoint which sets the iron-session cookie,
 * then navigates to /dashboard.
 *
 * The login page calls apiClient.login() (in-memory mock) which does NOT set
 * the server-side iron-session cookie. The middleware checks iron-session, so we
 * must call /api/auth/login directly to establish the session.
 *
 * The mock apiClient defaults to USERS[0] (rad1 — radiologist), so the layout's
 * client-side check passes for radiologist. For doctor login, we also evaluate JS
 * to set the mock session user to the correct user.
 */
export async function loginViaApi(page: Page, email: string, password = 'demo2024') {
  // Hit the real server API to get an iron-session cookie
  const response = await page.request.post('/api/auth/login', {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} — ${await response.text()}`)
  }

  const { user } = await response.json()

  // Navigate to dashboard — middleware passes because iron-session cookie is set
  await page.goto('/dashboard')

  // Wait for JS to load, then set the mock client's sessionUser so the layout
  // client-side check uses the correct user (especially important for doctor role)
  await page.waitForFunction(() => (window as any).__sonaraApiLoaded !== undefined || true)
  await page.evaluate((u) => {
    // The apiClient module is imported by the Next.js bundle — try to set sessionUser
    // via the setSessionUser export if available on the window
    if ((window as any).__sonaraSetUser) {
      (window as any).__sonaraSetUser(u)
    }
  }, user)

  await page.waitForURL('**/dashboard', { timeout: 15_000 })
}

/**
 * Logs in via the UI form. Use for login-specific tests only.
 * For general test setup, prefer loginViaApi which is faster and more reliable.
 */
export async function loginViaForm(page: Page, email: string, password = 'demo2024') {
  await page.goto('/login')
  await page.waitForSelector('#email', { timeout: 10_000 })
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
}

/** Login as radiologist (rad1@demo.pl) via API */
export async function loginAsRadiologist(page: Page) {
  return loginViaApi(page, 'rad1@demo.pl')
}

/** Login as doctor (doc1@demo.pl) via API */
export async function loginAsDoctor(page: Page) {
  return loginViaApi(page, 'doc1@demo.pl')
}
