import { test, expect } from '@playwright/test'
import path from 'path'
import { loginAsRadiologist } from './helpers/auth'

/**
 * Case A — USG tarczycy, image flow
 * Pre-seeded Case A (id: rad-A): 5 findings (3 high/medium, 2 more), impression with TI-RADS 4.
 *
 * Mock AI client returns Case A data when analyzeImage is called.
 */

const FIXTURE_PNG = path.resolve(__dirname, './fixtures/test-image.png')

test.describe('Case A — USG tarczycy, image flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRadiologist(page)
  })

  test('pre-seeded Case A report loads with exam type heading', async ({ page }) => {
    await page.goto('/examination/rad-A')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const heading = page.locator('h1').first()
    await expect(heading).toContainText('USG tarczycy')
  })

  test('Case A has CASE A badge', async ({ page }) => {
    await page.goto('/examination/rad-A')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const caseBadge = page.locator('text=CASE A').first()
    await expect(caseBadge).toBeVisible({ timeout: 5_000 })
  })

  test('Case A report shows findings with "Zmiana ogniskowa"', async ({ page }) => {
    await page.goto('/examination/rad-A')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const findingText = page.locator('text=Zmiana ogniskowa').first()
    await expect(findingText).toBeVisible({ timeout: 8_000 })
  })

  test('Case A impression contains TI-RADS classification', async ({ page }) => {
    await page.goto('/examination/rad-A')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const impression = page.locator('text=TI-RADS').first()
    await expect(impression).toBeVisible({ timeout: 8_000 })
  })

  test('confidence badges contain text labels — not color-only (WCAG)', async ({ page }) => {
    await page.goto('/examination/rad-A')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // badge-hi shows "pewne", badge-med shows "niepewne"
    const badgeHi = page.locator('.badge-hi').first()
    await expect(badgeHi).toBeVisible({ timeout: 8_000 })
    const text = await badgeHi.textContent()
    expect(text?.trim()).toBe('pewne')

    const badgeMed = page.locator('.badge-med').first()
    await expect(badgeMed).toBeVisible({ timeout: 5_000 })
    const medText = await badgeMed.textContent()
    expect(medText?.trim()).toBe('niepewne')
  })

  test('Approve button is visible on draft report', async ({ page }) => {
    await page.goto('/examination/rad-A')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Approve button text is "Zatwierdź raport"
    const approveBtn = page.locator('button').filter({ hasText: 'Zatwierdź raport' }).first()
    await expect(approveBtn).toBeVisible({ timeout: 5_000 })
  })

  test('AI Quality Check section is visible on Case A', async ({ page }) => {
    await page.goto('/examination/rad-A')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const qcSection = page.locator('text=AI Quality Check').first()
    await expect(qcSection).toBeVisible({ timeout: 8_000 })
  })

  test('new examination form loads with mode selection', async ({ page }) => {
    await page.goto('/examination/new')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Mode buttons should be visible
    const imageModeBtn = page.locator('[aria-pressed]').filter({ hasText: /Generuj ze zdjęcia|image/i }).first()
    await expect(imageModeBtn).toBeVisible({ timeout: 5_000 })
    const voiceModeBtn = page.locator('[aria-pressed]').filter({ hasText: /Nagraj głos|voice/i }).first()
    await expect(voiceModeBtn).toBeVisible({ timeout: 5_000 })
  })

  test('image mode: file input is present', async ({ page }) => {
    await page.goto('/examination/new')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Image mode is default — file input should be visible
    const fileInput = page.locator('input[type="file"]').first()
    await expect(fileInput).toBeAttached({ timeout: 5_000 })
  })

  test('image upload: can set files on file input fixture', async ({ page }) => {
    await page.goto('/examination/new')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(FIXTURE_PNG)

    // After setting file, input should still be attached
    await expect(fileInput).toBeAttached()
  })
})
