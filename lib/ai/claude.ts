// BE2: implement Claude API client
// - Three-layer prompt system (Warstwa 1 + 2 + 3) with prompt caching (cache_control: ephemeral on Warstwa 1+2)
// - Two-step pipeline (AI_PIPELINE_ADVANCED=false): Vision Extraction → Report Generation
// - Advanced pipeline (AI_PIPELINE_ADVANCED=true): SIR → Multi-Step (5 prompts) → AI Reviewer
// - Extended thinking: enabled when imageCount >= 3 || imageQuality === 'suboptimal'
// - temperature: 0 when thinking disabled; max_tokens: 10000 thinking / 1500 standard
// - Max 1 auto-retry on JSON parse failure
export {}
