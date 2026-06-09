import { test, expect } from '@playwright/test'
import { loginAsDoctor } from './helpers/auth'

/**
 * Case C — Doctor visit flow
 * Pre-seeded Case C (id: med-C): doctor visit for Anna Kowalska referencing approved Case A.
 * Fields: anamnesis, diagnosis, recommendations all filled.
 * Also has patientExplanation (patient-facing summary).
 */

test.describe('Case C — Lekarz: wizyta', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page)
  })

  test('doctor visit page med-C loads', async ({ page }) => {
    await page.goto('/visit/med-C')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Page stays on /visit/med-C (no redirect)
    expect(page.url()).toContain('/visit/med-C')
  })

  test('Case C badge is visible', async ({ page }) => {
    await page.goto('/visit/med-C')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const caseBadge = page.locator('text=CASE C').first()
    await expect(caseBadge).toBeVisible({ timeout: 5_000 })
  })

  test('anamnesis textarea is visible and contains data', async ({ page }) => {
    await page.goto('/visit/med-C')
    await page.waitForSelector('#anamnesis', { timeout: 10_000 })

    const field = page.locator('#anamnesis').first()
    await expect(field).toBeVisible()
    const value = await field.inputValue()
    expect(value.length).toBeGreaterThan(10)
    // Contains patient history text
    expect(value).toContain('guzka')
  })

  test('diagnosis textarea is visible and contains TI-RADS reference', async ({ page }) => {
    await page.goto('/visit/med-C')
    await page.waitForSelector('#diagnosis', { timeout: 10_000 })

    const field = page.locator('#diagnosis').first()
    await expect(field).toBeVisible()
    const value = await field.inputValue()
    expect(value.length).toBeGreaterThan(10)
    expect(value).toContain('TI-RADS')
  })

  test('recommendations textarea is visible with referral info', async ({ page }) => {
    await page.goto('/visit/med-C')
    await page.waitForSelector('#recommendations', { timeout: 10_000 })

    const field = page.locator('#recommendations').first()
    await expect(field).toBeVisible()
    const value = await field.inputValue()
    expect(value.length).toBeGreaterThan(10)
    // Contains referral (BAC) info
    expect(value).toContain('BAC')
  })

  test('patient explanation panel is visible ("Dla pacjenta")', async ({ page }) => {
    await page.goto('/visit/med-C')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // The Collapse section for patient explanation uses t('patientPanel')
    const patientPanel = page.locator('text=Dla pacjenta').first()
    await expect(patientPanel).toBeVisible({ timeout: 8_000 })
  })

  test('"Zatwierdź i zapisz" button is visible (draft status)', async ({ page }) => {
    await page.goto('/visit/med-C')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Uses t('saveApprove') = "Zatwierdź i zapisz"
    const approveBtn = page.locator('button').filter({ hasText: /zatwierdź i zapisz|save.*approve/i }).first()
    await expect(approveBtn).toBeVisible({ timeout: 5_000 })
  })

  test('visit /visit redirects to /visit/new', async ({ page }) => {
    await page.goto('/visit')
    await page.waitForURL('**/visit/new', { timeout: 8_000 })
    expect(page.url()).toContain('/visit/new')
  })

  test('new visit page (/visit/new) renders voice recorder after patient selection', async ({ page }) => {
    await page.goto('/visit/new')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Patient must be selected first — VoiceRecorder is gated on (!isNew || selectedPatient)
    const combobox = page.getByRole('combobox', { name: /szukaj po nazwisku|search/i }).first()
    await expect(combobox).toBeVisible({ timeout: 5_000 })
    await combobox.click()

    // Type in the search input that opens inside the dropdown
    const searchInput = page.locator('[role=listbox] input').first()
    await searchInput.fill('Anna')

    // Click the first option (Anna Kowalska)
    const option = page.locator('[role=option]').first()
    await expect(option).toBeVisible({ timeout: 3_000 })
    await option.click()

    // Now the voice recorder should be visible
    const recordBtn = page.locator('button').filter({ hasText: /nagraj wizytę|record visit|nagraj/i }).first()
    await expect(recordBtn).toBeVisible({ timeout: 5_000 })
  })
})
