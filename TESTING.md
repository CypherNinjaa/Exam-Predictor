# 🧪 Model Testing Guide

This directory contains test scripts for all Gemini multimodal models.

## Prerequisites

1. Install dependencies:

```bash
npm install tsx
```

2. Ensure your `.env` file has the Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

## Running Tests

### Test All Models (Full Suite)

```bash
npx tsx test-models.ts all
```

⚠️ **Warning**: This will take 15-30 minutes to complete!

### Test Individual Models

#### Imagen 4.0 (High-Quality Images)

```bash
npx tsx test-models.ts imagen
```

- Tests 3 different prompts with various aspect ratios
- Takes ~1-2 minutes
- Generates high-quality images

#### Nano Banana (Fast Images)

```bash
npx tsx test-models.ts nano
```

- Tests 3 different prompts
- Takes ~30-60 seconds
- Generates fast, good-quality images

#### Veo 3.1 Fast (Quick Videos)

```bash
npx tsx test-models.ts veo-fast
```

- Tests 2 video prompts at 720p
- Takes ~5-7 minutes
- Generates good-quality videos

#### Veo 3.1 HQ (High-Quality Videos)

```bash
npx tsx test-models.ts veo-hq
```

- Tests 1 video prompt at 1080p
- Takes ~7-12 minutes
- Generates professional-quality video

## Output

All generated media will be saved in the `test-outputs/` directory:

```
test-outputs/
├── imagen-1-1.png          # Imagen 4.0 outputs
├── imagen-2-1.png
├── imagen-3-1.png
├── nano-1.png              # Nano Banana outputs
├── nano-2.png
├── nano-3.png
├── veo-fast-1.mp4          # Veo Fast outputs
├── veo-fast-2.mp4
└── veo-hq-1.mp4            # Veo HQ output
```

## Expected Results

### ✅ Success Indicators

- Images should be clear and match the prompts
- Videos should play smoothly without artifacts
- Files should be proper sizes:
  - Images: 100-500 KB
  - Videos (720p): 5-20 MB
  - Videos (1080p): 20-50 MB

### ❌ Common Issues

1. **API Key Error**

   ```
   Error: API key not configured
   ```

   → Check your `.env` file

2. **Quota Exceeded**

   ```
   Error: Quota exceeded
   ```

   → Wait a few hours or upgrade your plan

3. **Timeout Error**

   ```
   Error: Operation timed out
   ```

   → Videos can take 10+ minutes, this is normal

4. **Network Error**
   ```
   Error: fetch failed
   ```
   → Check your internet connection

## Test Prompts Used

### Imagen 4.0

1. "A futuristic robot teaching students in a classroom" (16:9)
2. "A peaceful zen garden with cherry blossoms" (1:1)
3. "A cyberpunk city street at night with neon lights" (9:16)

### Nano Banana

1. "A friendly AI assistant mascot, cartoon style"
2. "A modern university campus with students walking"
3. "An abstract pattern with purple and pink gradients"

### Veo Fast

1. "A time-lapse of clouds moving over mountains" (16:9, 720p)
2. "A robot walking through a futuristic city" (9:16, 720p)

### Veo HQ

1. "A sunrise over a peaceful lake with birds flying" (16:9, 1080p)

## Performance Benchmarks

| Model       | Time per Generation | Quality   | Cost (approx) |
| ----------- | ------------------- | --------- | ------------- |
| Imagen 4.0  | 15-30s              | Excellent | $0.04-0.08    |
| Nano Banana | 5-15s               | Good      | $0.01-0.02    |
| Veo Fast    | 2-3 min             | Good      | $0.50-1.00    |
| Veo HQ      | 7-12 min            | Excellent | $1.50-2.50    |

## Debugging

If a test fails, check:

1. **Console output** - Look for specific error messages
2. **API key validity** - Test with a simple text generation first
3. **Quotas** - Check Google AI Studio dashboard
4. **Network** - Ensure stable internet connection
5. **File permissions** - Verify write access to test-outputs/

## Manual Testing in UI

After running these tests, test the same prompts in the chat UI:

1. Start dev server: `npm run dev`
2. Go to `/chat`
3. Try each mode (Text/Image/Video)
4. Compare UI results with test outputs

## Next Steps

If all tests pass:

- ✅ Models are working correctly
- ✅ API integration is successful
- ✅ Ready for production deployment

If tests fail:

- 🔍 Check error messages
- 📝 Review API documentation
- 🆘 Ask for help with specific error logs
