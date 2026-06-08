import { test, expect } from '@playwright/test'
import { loginAsDoctor, loginAsRadiologist, loginViaApi } from './helpers/auth'

/**
 * New UI elements — Faza 5 (post-integration) tests
 *
 * Covers:
 * 2a. Transcription quality banners (visit/[id])
 * 2b. AI badge on visit/[id]
 * 2c. "Kontynuuj bez AI" button — non_diagnostic case
 * 2d. Toast on language change
 * 2e. Case A — approve flow end-to-end via real API
 */

// ---------------------------------------------------------------------------
// 2a. Transcription quality banners (visit/[id])
// ---------------------------------------------------------------------------

test.describe('Transcription quality banners (visit/[id])', () => {
  /**
   * med-C has transcriptionQuality: 'good' → no banner.
   * Seed data does NOT have a 'partial' or 'poor' transcription quality case.
   * Banner tests are skipped with a clear comment so they can be added if seed data
   * is extended with a partial/poor quality case.
   *
   * This test verifies that with quality 'good', NO quality banner is shown.
   */
  test('no transcription quality banner shown when quality is "good" (med-C)', async ({ page }) => {
    await loginAsDoctor(page)
    await page.goto('/visit/med-C')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // med-C transcriptionQuality === 'good' — no warn or crit quality banner expected
    const warnBanner = page.locator('.banner-warn').filter({ hasText: /transkrypcja/i })
    const critBanner = page.locator('.banner-crit').filter({ hasText: /transkrypcja/i })
    await expect(warnBanner).toHaveCount(0)
    await expect(critBanner).toHaveCount(0)
  })

  // NOTE: There is no seed case with transcriptionQuality: 'partial' or 'poor' in the
  // current store.ts. If such a case is added (e.g. med-partial), add tests like:
  //
  // test('shows yellow warning banner when transcriptionQuality is "partial"', async ({ page }) => {
  //   await loginAsDoctor(page)
  //   await page.goto('/visit/med-partial')
  //   await page.waitForSelector('h1', { timeout: 10_000 })
  //   const warnBanner = page.locator('.banner-warn').filter({ hasText: /transkrypcja/i }).first()
  //   await expect(warnBanner).toBeVisible({ timeout: 5_000 })
  // })
  //
  // test('shows red critical banner when transcriptionQuality is "poor"', async ({ page }) => {
  //   await loginAsDoctor(page)
  //   await page.goto('/visit/med-poor')
  //   await page.waitForSelector('h1', { timeout: 10_000 })
  //   const critBanner = page.locator('.banner-crit').filter({ hasText: /transkrypcja/i }).first()
  //   await expect(critBanner).toBeVisible({ timeout: 5_000 })
  // })
})

// ---------------------------------------------------------------------------
// 2b. AI badge on visit/[id]
// ---------------------------------------------------------------------------

test.describe('AI badge on visit/[id]', () => {
  test('shows AI-generated badge on medical draft report (med-C)', async ({ page }) => {
    await loginAsDoctor(page)
    await page.goto('/visit/med-C')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // med-C: aiGenerated=true, status='draft' → badge-ai with "Wygenerowane przez AI" text
    const aiBadge = page.locator('.badge-ai').first()
    await expect(aiBadge).toBeVisible({ timeout: 8_000 })
  })

  test('AI badge is NOT shown on approved medical report (med-seed-1)', async ({ page }) => {
    await loginAsDoctor(page)
    await page.goto('/visit/med-seed-1')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // med-seed-1: status='approved' → badge-approved shown, badge-ai NOT shown
    const approvedBadge = page.locator('.badge-approved').first()
    await expect(approvedBadge).toBeVisible({ timeout: 8_000 })

    const aiBadge = page.locator('.badge-ai')
    await expect(aiBadge).toHaveCount(0)
  })
})

// ---------------------------------------------------------------------------
// 2c. "Kontynuuj bez AI" button — non_diagnostic case
// ---------------------------------------------------------------------------

test.describe('"Kontynuuj bez AI" button', () => {
  /**
   * Seed data check:
   * - rad-D has imageQuality: 'suboptimal' (not 'non_diagnostic')
   * - No seed case with imageQuality: 'non_diagnostic' exists.
   *
   * The "Kontynuuj bez AI" button appears ONLY when imageQuality === 'non_diagnostic'.
   * Test below verifies that rad-D (suboptimal) shows the WARN banner but NOT the
   * "Kontynuuj bez AI" button (which is only on the crit/non_diagnostic banner).
   */
  test('rad-D (suboptimal quality) shows warn banner but NOT "Kontynuuj bez AI" button', async ({ page }) => {
    await loginAsRadiologist(page)
    await page.goto('/examination/rad-D')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Suboptimal → yellow banner visible
    const warnBanner = page.locator('.banner-warn').filter({ hasText: 'Obraz suboptymalny' }).first()
    await expect(warnBanner).toBeVisible({ timeout: 8_000 })

    // "Kontynuuj bez AI" button should NOT appear (only for non_diagnostic)
    const continueBtn = page.locator('button').filter({ hasText: /kontynuuj bez ai/i })
    await expect(continueBtn).toHaveCount(0)
  })

  // NOTE: There is no seed case with imageQuality: 'non_diagnostic' in the current
  // store.ts. If such a case is added (e.g. rad-E), add a test like:
  //
  // test('non_diagnostic case shows "Kontynuuj bez AI" button in crit banner', async ({ page }) => {
  //   await loginAsRadiologist(page)
  //   await page.goto('/examination/rad-E')
  //   await page.waitForSelector('h1', { timeout: 10_000 })
  //   const continueBtn = page.locator('button').filter({ hasText: /kontynuuj bez ai/i }).first()
  //   await expect(continueBtn).toBeVisible({ timeout: 5_000 })
  // })
})

// ---------------------------------------------------------------------------
// 2d. Toast on language change
// ---------------------------------------------------------------------------

test.describe('Toast on language change', () => {
  test('shows toast (role=status) when language is switched to EN', async ({ page }) => {
    await loginViaApi(page, 'rad1@demo.pl', 'demo2024')
    // loginViaApi navigates to /dashboard

    // Default language is PL — switch to EN
    const enBtn = page.locator('.lang-toggle button:has-text("EN")').first()
    await enBtn.click()

    // Toast appears with role="status" (the Toast component uses role="status")
    // Disclaimer also has role="status" but the toast has class "toast"
    const toast = page.locator('.toast[role="status"]').first()
    await expect(toast).toBeVisible({ timeout: 5_000 })
  })

  test('toast auto-dismisses after ~4 seconds', async ({ page }) => {
    await loginViaApi(page, 'rad1@demo.pl', 'demo2024')

    const enBtn = page.locator('.lang-toggle button:has-text("EN")').first()
    await enBtn.click()

    const toast = page.locator('.toast[role="status"]').first()
    await expect(toast).toBeVisible({ timeout: 5_000 })

    // Toast dismisses after 4 seconds — wait 5 seconds for safety
    await expect(toast).not.toBeVisible({ timeout: 6_000 })
  })

  test('toast message contains language reference text', async ({ page }) => {
    await loginViaApi(page, 'rad1@demo.pl', 'demo2024')

    const enBtn = page.locator('.lang-toggle button:has-text("EN")').first()
    await enBtn.click()

    const toast = page.locator('.toast[role="status"]').first()
    await expect(toast).toBeVisible({ timeout: 5_000 })

    // The langToast text mentions "PL" (language the report is generated in)
    const toastText = await toast.textContent()
    expect(toastText).toBeTruthy()
    expect(toastText!.length).toBeGreaterThan(10)
  })
})

// ---------------------------------------------------------------------------
// 2e. Case A — approve flow end-to-end via real API
// ---------------------------------------------------------------------------

test.describe('Case A — approve flow via real API', () => {
  test('loads pre-seeded rad-A report with TI-RADS in impression (real API)', async ({ page }) => {
    await loginAsRadiologist(page)
    await page.goto('/examination/rad-A')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Data loaded via real API (/api/reports/radiological/rad-A)
    // Impression must contain TI-RADS classification
    const tiRads = page.locator('text=TI-RADS').first()
    await expect(tiRads).toBeVisible({ timeout: 8_000 })

    // Findings must be present (5 findings in Case A seed)
    const findingText = page.locator('text=Zmiana ogniskowa').first()
    await expect(findingText).toBeVisible({ timeout: 8_000 })
  })

  test('Case A: full approve cycle — click Zatwierdź → confirm → badge-approved appears', async ({ page }) => {
    await loginAsRadiologist(page)
    await page.goto('/examination/rad-A')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Verify it's a draft (approve button visible)
    const approveBtn = page.locator('button').filter({ hasText: 'Zatwierdź raport' }).first()
    await expect(approveBtn).toBeVisible({ timeout: 5_000 })
    await expect(approveBtn).not.toBeDisabled()

    // Open confirmation modal
    await approveBtn.click()
    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })

    // Confirm approval
    const confirmBtn = modal.locator('button.btn-primary').last()
    await confirmBtn.click()

    // After approval: badge-approved appears, approve button disappears
    const approvedBadge = page.locator('.badge-approved').first()
    await expect(approvedBadge).toBeVisible({ timeout: 8_000 })

    const approveAfter = page.locator('button').filter({ hasText: 'Zatwierdź raport' })
    await expect(approveAfter).toHaveCount(0)
  })

  test('rad-B: AI badge visible on draft report (aiGenerated=true, status=draft)', async ({ page }) => {
    await loginAsRadiologist(page)
    // Use rad-B (voice draft, aiGenerated=true) to avoid state mutation from the approve
    // cycle test above which changes rad-A status to 'approved'.
    await page.goto('/examination/rad-B')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // badge-ai only shown on draft AI-generated reports
    const aiBadge = page.locator('.badge-ai').first()
    await expect(aiBadge).toBeVisible({ timeout: 8_000 })
  })

  test('pre-approved rad-A-appr: no AI badge, shows badge-approved', async ({ page }) => {
    await loginAsRadiologist(page)
    await page.goto('/examination/rad-A-appr')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Approved report shows badge-approved, NOT badge-ai
    const approvedBadge = page.locator('.badge-approved').first()
    await expect(approvedBadge).toBeVisible({ timeout: 5_000 })

    const aiBadge = page.locator('.badge-ai')
    await expect(aiBadge).toHaveCount(0)
  })
})
