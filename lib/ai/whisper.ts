// BE2: implement OpenAI Whisper client
// - model: 'whisper-1', language: 'pl', response_format: 'verbose_json', temperature: 0
// - WHISPER_MEDICAL_PROMPT: ~224 tokens of Polish medical terminology priming
// - Pre-processing: strip fillers (eee, yyy, mmm), auto-correct common Whisper PL errors
// - Segments with avg_logprob < -0.8 → transcriptionWarning
// - transcription < 200 chars → transcriptionWarning: "Nagranie może być zbyt krótkie"
export {}
