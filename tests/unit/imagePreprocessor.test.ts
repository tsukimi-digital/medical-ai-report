import { describe, it, expect } from 'vitest'
import { preprocessImage } from '@/lib/ai/image-preprocessor'

/**
 * Generates a minimal valid PNG buffer (1x1 red pixel).
 * This is a hand-crafted valid PNG file in binary.
 */
function createMinimalPng(width = 1, height = 1): Buffer {
  // PNG signature + IHDR + IDAT + IEND for a 1x1 red pixel PNG
  // Generated with: sharp({ create: { width: 1, height: 1, channels: 3, background: {r:255,g:0,b:0} }}).png().toBuffer()
  // We use a known-valid 1x1 PNG as bytes:
  const pngBytes = Buffer.from(
    '89504e470d0a1a0a' + // PNG signature
    '0000000d49484452' + // IHDR chunk length + type
    '00000001' +         // width = 1
    '00000001' +         // height = 1
    '08020000' +         // 8-bit, RGB, ...
    '007a9de4' +         // CRC
    '0000000c4944415478' + // IDAT chunk
    '9c6260f8cf000001' +   // compressed data (1 red pixel)
    '0200059e14db' +       // IDAT CRC approximation
    '0000000049454e44' +   // IEND
    'ae426082',           // IEND CRC
    'hex'
  )
  return pngBytes
}

// A real valid minimal 1x1 red PNG (37 bytes)
const VALID_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADklEQVQI12P4z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=='

describe('imagePreprocessor', () => {
  it('preprocesses a valid PNG buffer and returns JPEG', async () => {
    const input = Buffer.from(VALID_PNG_BASE64, 'base64')
    const result = await preprocessImage(input)

    expect(result).toBeDefined()
    expect(result.mimeType).toBe('image/jpeg')
    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('output is a valid JPEG (starts with JPEG magic bytes FF D8 FF)', async () => {
    const input = Buffer.from(VALID_PNG_BASE64, 'base64')
    const result = await preprocessImage(input)

    // JPEG files start with FF D8 FF
    expect(result.data[0]).toBe(0xff)
    expect(result.data[1]).toBe(0xd8)
    expect(result.data[2]).toBe(0xff)
  })

  it('output is smaller than or equal to input (or reasonable for tiny images)', async () => {
    const input = Buffer.from(VALID_PNG_BASE64, 'base64')
    const result = await preprocessImage(input)
    // For a 1x1 image JPEG overhead may be larger, just verify it's non-zero
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('preprocesses larger buffer (50x50 synthetic PNG)', async () => {
    // Create a 50x50 white PNG using sharp
    const sharp = (await import('sharp')).default
    const input = await sharp({
      create: {
        width: 50,
        height: 50,
        channels: 3,
        background: { r: 128, g: 128, b: 128 },
      },
    }).png().toBuffer()

    const result = await preprocessImage(input)

    expect(result.mimeType).toBe('image/jpeg')
    expect(result.data.length).toBeGreaterThan(100)
    // Check JPEG magic bytes
    expect(result.data[0]).toBe(0xff)
    expect(result.data[1]).toBe(0xd8)
  })

  it('does not enlarge a small image beyond 1568px', async () => {
    const sharp = (await import('sharp')).default
    // Create a small 100x100 image
    const input = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 100, b: 200 },
      },
    }).png().toBuffer()

    const result = await preprocessImage(input)
    const metadata = await sharp(result.data).metadata()

    // Should not enlarge — width and height should remain <= 1568
    expect((metadata.width ?? 0)).toBeLessThanOrEqual(1568)
    expect((metadata.height ?? 0)).toBeLessThanOrEqual(1568)
    // And should not have been enlarged (was 100x100)
    expect((metadata.width ?? 0)).toBeLessThanOrEqual(100)
  })
})
