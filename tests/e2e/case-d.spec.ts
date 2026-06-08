import { test, expect } from '@playwright/test'
import { loginAsRadiologist } from './helpers/auth'

/**
 * Case D — AI Quality Review / conflict
 * Pre-seeded Case D (id: rad-D):
 * - imageQuality: suboptimal → banner-warn "Obraz suboptymalny"
 * - lowConfidenceFindings: 1 item with confidence "wątpliwe"
 * - aiQualityCheck: needs_attention with source_evidence fail
 * - fusionResult: conflicts between image and voice
 * - status: draft → "Zatwierdź raport" button enabled
 */

test.describe('Case D — Approve flow & AI Quality Review', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRadiologist(page)
  })

  test('Case D report page loads with exam type heading', async ({ page }) => {
    await page.goto('/examination/rad-D')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const heading = page.locator('h1').first()
    await expect(heading).toContainText('USG tarczycy')
  })

  test('Case D badge is visible', async ({ page }) => {
    await page.goto('/examination/rad-D')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const caseBadge = page.locator('text=CASE D').first()
    await expect(caseBadge).toBeVisible({ timeout: 5_000 })
  })

  test('suboptimal image quality shows warning banner with text "Obraz suboptymalny"', async ({ page }) => {
    await page.goto('/examination/rad-D')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Banner with "Obraz suboptymalny" text from imageQuality === 'suboptimal'
    const warnBanner = page.locator('.banner-warn').filter({ hasText: 'Obraz suboptymalny' }).first()
    await expect(warnBanner).toBeVisible({ timeout: 8_000 })
  })

  test('AI Quality Check panel is visible on Case D', async ({ page }) => {
    await page.goto('/examination/rad-D')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const qcSection = page.locator('text=AI Quality Check').first()
    await expect(qcSection).toBeVisible({ timeout: 8_000 })
  })

  test('low-confidence finding badge "wątpliwe" is present', async ({ page }) => {
    await page.goto('/examination/rad-D')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Case D has a low-confidence finding → badge-low shows "wątpliwe"
    const lowBadge = page.locator('.badge-low').first()
    await expect(lowBadge).toBeVisible({ timeout: 8_000 })
    const text = await lowBadge.textContent()
    expect(text?.trim()).toBe('wątpliwe')
  })

  test('"Zatwierdź raport" button is available (Case D has 1 finding + impression)', async ({ page }) => {
    await page.goto('/examination/rad-D')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const approveBtn = page.locator('button').filter({ hasText: 'Zatwierdź raport' }).first()
    await expect(approveBtn).toBeVisible({ timeout: 5_000 })
    // Button should NOT be disabled (Case D has findings)
    const disabled = await approveBtn.getAttribute('disabled')
    expect(disabled).toBeNull()
  })

  test('approve flow: clicking Zatwierdź raport opens confirmation modal', async ({ page }) => {
    await page.goto('/examination/rad-D')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const approveBtn = page.locator('button').filter({ hasText: 'Zatwierdź raport' }).first()
    await approveBtn.click()

    // Modal opens with role="dialog"
    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })
  })

  test('approve flow: confirming changes report status to approved', async ({ page }) => {
    await page.goto('/examination/rad-D')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Click Approve button
    const approveBtn = page.locator('button').filter({ hasText: 'Zatwierdź raport' }).first()
    await approveBtn.click()

    // Confirm in modal — the last btn-primary in the dialog
    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })

    const confirmBtn = modal.locator('button.btn-primary').last()
    await confirmBtn.click()

    // After approval: badge-approved appears
    const approvedBadge = page.locator('.badge-approved').first()
    await expect(approvedBadge).toBeVisible({ timeout: 8_000 })
  })

  test('approved report (rad-A-appr) shows badge-approved and no approve button', async ({ page }) => {
    // rad-A-appr is the pre-seeded approved Case A report
    await page.goto('/examination/rad-A-appr')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Approved badge must be visible
    const approvedBadge = page.locator('.badge-approved').first()
    await expect(approvedBadge).toBeVisible({ timeout: 5_000 })

    // Approve button should NOT be present (report is already approved)
    const approveBtn = page.locator('button').filter({ hasText: 'Zatwierdź raport' })
    await expect(approveBtn).toHaveCount(0)
  })
})
