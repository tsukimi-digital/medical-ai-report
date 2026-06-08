// BE2: implement sharp-based image preprocessor
// preprocessImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer, mimeType: 'image/jpeg' }>
// - Resize to max 1568px on longest side (preserve aspect ratio)
// - Convert to JPEG quality 85
// - Strip EXIF (removes patient data recorded by ultrasound device)
// - Effect: 40–70% fewer tokens at same diagnostic quality
export {}
