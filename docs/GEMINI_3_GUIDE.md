# Gemini 3.0 Preview Integration Guide

## Overview

As of **November 18, 2025**, Google released **Gemini 3.0** in Public Preview. This document explains how to use it in AmityMate.ai and the important limitations to consider.

## Current Default: Gemini 2.5 Pro ✅

**By default, the app uses Gemini 2.5 Pro** for predictions. This is the **recommended** choice for production because:

- ✅ **Stable** and production-ready
- ✅ **FREE tier friendly** - Higher daily limits
- ✅ **Cost-effective** on paid tiers
- ✅ **Advanced thinking mode** with 32K thinking budget
- ✅ **Proven reliability** for exam predictions

## Gemini 3.0 Preview (Optional) 🚀

### What's New in Gemini 3.0?

Gemini 3.0 Pro Preview (`gemini-3-pro-preview`) is the latest "Reasoning & Agentic" model that excels at:

- 🧠 **Advanced Reasoning** - Complex logic and problem-solving
- 🤖 **Agentic Coding** - "Vibe coding" from vague instructions
- 📊 **Better Context Understanding** - Improved comprehension

### ⚠️ IMPORTANT LIMITATIONS

Before enabling Gemini 3.0, understand these critical limitations:

1. **Free Tier Limits**: Only ~30-50 prompts/day (vs unlimited/higher on 2.5)
2. **Cost**: 2-3x more expensive on paid tiers
3. **Stability**: Preview version - may have occasional issues
4. **Rate Limits**: Strict throttling due to "overwhelming demand"

### When to Use Gemini 3.0?

**✅ Good Use Cases:**

- Personal testing/development
- Low-traffic admin tools
- Experimental features
- Complex reasoning tasks

**❌ Avoid For:**

- Production apps with many users
- Public-facing features
- High-frequency API calls
- Cost-sensitive applications

## How to Enable Gemini 3.0

### Method 1: Environment Variable (Recommended)

Add to your `.env` file:

```bash
ENABLE_GEMINI_3="true"
```

This enables Gemini 3.0 globally for all predictions.

### Method 2: Per-Request (API)

When calling the prediction API, pass the flag:

```typescript
const response = await fetch("/api/admin/predict", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    subjectId: "...",
    examType: "MIDTERM_2",
    syllabusScope: [...],
    useGemini3: true, // ← Enable Gemini 3.0 for this request
  }),
});
```

## Code Implementation

### In `src/lib/gemini.ts`

```typescript
export const MODELS = {
	PRO: "gemini-2.5-pro", // Default (recommended)
	GEMINI_3_PREVIEW: "gemini-3-pro-preview", // Optional
};

// Automatically selects model based on ENABLE_GEMINI_3 env var
export function getPredictionModel(): string {
	const useGemini3 = process.env.ENABLE_GEMINI_3 === "true";
	return useGemini3 ? MODELS.GEMINI_3_PREVIEW : MODELS.PRO;
}
```

### In `src/lib/prediction-engine.ts`

```typescript
export interface PredictionConfig {
	// ... other fields
	useGemini3?: boolean; // Optional flag
}

// Usage in prediction generation
const response = await generateWithThinking(
	prompt,
	24576, // thinking budget
	useGemini3 // true = Gemini 3.0, false = Gemini 2.5 Pro
);
```

## Monitoring Usage

When Gemini 3.0 is enabled, you'll see warnings in console:

```
⚠️ Using Gemini 3.0 Preview - Limited to ~30-50 requests/day on free tier
```

### Check Your Usage

Monitor your Gemini API usage at:
https://makersuite.google.com/app/apikey

## Recommendations

### For Development

```bash
# .env
ENABLE_GEMINI_3="true"  # Test new features
```

### For Production

```bash
# .env
ENABLE_GEMINI_3="false" # Use stable Gemini 2.5 Pro
```

### For Admin Testing

```typescript
// Only enable for admin-only features
const config: PredictionConfig = {
	// ... other config
	useGemini3: isAdminUser && isTestingMode,
};
```

## Migration Path

When Gemini 3.0 becomes stable (exits preview):

1. Google will announce stable release
2. Update model name from `gemini-3-pro-preview` to `gemini-3-pro`
3. Limits will likely increase
4. Price may decrease
5. We can consider making it the default

## Troubleshooting

### Error: "Rate limit exceeded"

- **Cause**: Hit the 30-50 request/day limit
- **Solution**: Disable Gemini 3.0 or wait 24 hours

### Error: "Model not found"

- **Cause**: Model name may have changed
- **Solution**: Check Google AI Studio for updated name

### Slower Response Times

- **Cause**: Preview model may have higher latency
- **Solution**: Expected behavior, use Gemini 2.5 Pro for speed

## Comparison Table

| Feature              | Gemini 2.5 Pro | Gemini 3.0 Preview |
| -------------------- | -------------- | ------------------ |
| **Stability**        | ✅ Stable      | ⚠️ Preview         |
| **Free Tier Limit**  | High           | ~30-50/day         |
| **Cost (Paid)**      | $$             | $$$                |
| **Reasoning**        | Excellent      | Better             |
| **Speed**            | Fast           | Moderate           |
| **Thinking Mode**    | ✅ Yes         | ✅ Yes             |
| **Production Ready** | ✅ Yes         | ⚠️ Testing Only    |

## Conclusion

**For AmityMate.ai production deployment**: Stick with **Gemini 2.5 Pro** (default).

**For testing new AI capabilities**: Enable **Gemini 3.0 Preview** in dev environment only.

## Resources

- [Gemini 3.0 Announcement](https://ai.google.dev/)
- [API Documentation](https://ai.google.dev/docs)
- [Pricing](https://ai.google.dev/pricing)
