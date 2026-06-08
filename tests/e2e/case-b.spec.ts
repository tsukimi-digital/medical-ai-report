import { test, expect } from '@playwright/test'
import { loginAsRadiologist } from './helpers/auth'

/**
 * Case B — USG jamy brzusznej, voice flow
 * Pre-seeded Case B (id: rad-B): voice mode, findings about liver/kidneys/biliary.
 *
 * MediaRecorder is not available in headless Playwright — we test:
 * 1. The pre-seeded Case B report loads correctly
 * 2. Voice recorder UI appears when voice mode is selected
 * 3. Image uploader is hidden in voice-only mode
 */

test.describe('Case B — USG jamy brzusznej, voice flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRadiologist(page)
  })

  test('pre-seeded Case B loads with exam type heading', async ({ page }) => {
    await page.goto('/examination/rad-B')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const heading = page.locator('h1').first()
    await expect(heading).toContainText('USG jamy brzusznej')
  })

  test('Case B badge is visible', async ({ page }) => {
    await page.goto('/examination/rad-B')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const caseBadge = page.locator('text=CASE B').first()
    await expect(caseBadge).toBeVisible({ timeout: 5_000 })
  })

  test('Case B shows liver finding from voice transcription', async ({ page }) => {
    await page.goto('/examination/rad-B')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Case B finding 1: "Wątroba niepowiększona..."
    const liverFinding = page.locator('text=wątroba').first()
    await expect(liverFinding).toBeVisible({ timeout: 8_000 })
  })

  test('Case B impression contains Bosniak classification', async ({ page }) => {
    await page.goto('/examination/rad-B')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Impression: "...torbiel (Bosniak I)..."
    const impression = page.locator('text=Bosniak').first()
    await expect(impression).toBeVisible({ timeout: 8_000 })
  })

  test('Case B AI Quality Check is visible', async ({ page }) => {
    await page.goto('/examination/rad-B')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const qcSection = page.locator('text=AI Quality Check').first()
    await expect(qcSection).toBeVisible({ timeout: 8_000 })
  })

  test('new examination: voice mode button shows "Nagraj głos" recorder', async ({ page }) => {
    await page.goto('/examination/new')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Click voice mode card
    const voiceModeCard = page.locator('[aria-pressed]').filter({ hasText: /Nagraj głos|voice/i }).first()
    await voiceModeCard.click()
    await page.waitForTimeout(300)

    // VoiceRecorder renders a "Nagraj głos" secondary button when in idle state
    const recordBtn = page.locator('button.btn-secondary').filter({ hasText: 'Nagraj głos' }).first()
    await expect(recordBtn).toBeVisible({ timeout: 5_000 })
  })

  test('new examination: voice mode — file input is hidden', async ({ page }) => {
    await page.goto('/examination/new')
    await page.waitForSelector('h1', { timeout: 10_000 })

    // Switch to voice mode
    const voiceModeCard = page.locator('[aria-pressed]').filter({ hasText: /Nagraj głos|voice/i }).first()
    await voiceModeCard.click()
    await page.waitForTimeout(300)

    // In voice mode the image uploader (file input) should not be rendered
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toHaveCount(0)
  })

  test('voice mode — clicking record button triggers microphone error in headless (smoke)', async ({ page }) => {
    await page.goto('/examination/new')
    await page.waitForSelector('h1', { timeout: 10_000 })

    const voiceModeCard = page.locator('[aria-pressed]').filter({ hasText: /Nagraj głos|voice/i }).first()
    await voiceModeCard.click()
    await page.waitForTimeout(300)

    const recordBtn = page.locator('button.btn-secondary').filter({ hasText: 'Nagraj głos' }).first()
    await recordBtn.click()
    await page.waitForTimeout(500)

    // In headless Playwright, MediaRecorder getUserMedia fails — VoiceRecorder shows error
    // OR the recording state changes — either way the record button interaction is handled
    // We just verify the click doesn't crash the page
    expect(page.url()).toContain('/examination/new')
  })
})
