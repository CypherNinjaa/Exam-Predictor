# AmityMate.ai - Multimodal AI Chat

## 🎨 New Features: Image & Video Generation

AmityMate.ai now supports **advanced multimodal AI capabilities** powered by Google's latest Gemini models!

### 🌟 What's New

#### 1. **Text Chat** (Existing)

- **Gemini 2.5 Flash**: Fast, intelligent responses
- **Gemini 2.5 Pro**: Advanced reasoning and deep analysis
- Real-time streaming responses
- Memory system with auto-detection
- Context-aware study assistance

#### 2. **Image Generation** (NEW!)

Two powerful models to choose from:

**Imagen 4.0 - High Quality**

- Professional-grade image generation
- Perfect for detailed, high-quality visuals
- Supports multiple aspect ratios: 1:1, 3:4, 4:3, 9:16, 16:9
- Best for: Presentations, study materials, creative projects

**Nano Banana (Gemini 2.5 Flash Image)**

- Fast, general-purpose image generation
- **Image editing capabilities**: Upload a reference image to edit/enhance
- Real-time generation
- Best for: Quick visuals, image editing, iterations

#### 3. **Video Generation** (NEW!)

Powered by **Veo 3.1** - Google's state-of-the-art video model:

**Veo 3.1 Fast**

- Quick video generation (2-3 minutes)
- 720p or 1080p resolution
- Landscape (16:9) or Portrait (9:16)
- Perfect for social media, quick demos

**Veo 3.1 High Quality**

- Premium video generation (5-10 minutes)
- Advanced features: reference images, last frame control
- Cinematic quality output
- Best for: Professional content, detailed scenes

---

## 🚀 How to Use

### Text Mode

1. Click **Text** mode (default)
2. Select **Fast** or **Advanced** model
3. Type your question about exams, subjects, or study tips
4. Get instant AI responses with memory context

### Image Mode

1. Click **Image** mode
2. Choose your model:
   - **Imagen 4.0**: High-quality generation
   - **Nano Banana**: General/editing (optional reference image upload)
3. Select aspect ratio: 1:1, 4:3, or 16:9
4. Describe the image you want
5. Click generate and wait ~10-30 seconds
6. View, download, or fullscreen your image

**Image Editing (Nano Banana only):**

- Upload a reference image
- Describe what changes you want
- AI will edit/enhance the image

### Video Mode

1. Click **Video** mode
2. Choose quality:
   - **Fast**: 2-3 minutes generation
   - **High Quality**: 5-10 minutes generation
3. Select aspect ratio: 16:9 (landscape) or 9:16 (portrait)
4. Select resolution: 720p or 1080p
5. (Optional) Upload a reference image
6. Describe your video scene
7. Click generate and wait (progress shown in chat)
8. View and download your video

---

## 💡 Example Prompts

### Text Chat

```
"Explain database normalization with examples"
"Generate 10 practice questions on Python functions"
"What are the best study strategies for my upcoming DBMS exam?"
```

### Image Generation

```
"A modern illustration of a neural network architecture"
"Create a diagram showing the OSI model layers"
"A futuristic classroom with students using VR headsets"
"A flowchart for binary search algorithm"
```

### Image Editing (Nano Banana)

```
Upload a photo, then: "Add a sunset background"
"Make the colors more vibrant"
"Remove the background and add a professional studio look"
```

### Video Generation

```
"A serene time-lapse of clouds moving over a mountain landscape"
"A futuristic city with flying cars at night"
"An animated explanation of how photosynthesis works"
"A robot learning to play chess"
```

---

## 🎯 Best Practices

### For Best Image Quality

- Be specific and descriptive
- Include style preferences (e.g., "realistic", "cartoon", "3D render")
- Specify colors, lighting, mood
- Use Imagen 4.0 for high-quality needs
- Use Nano Banana for quick iterations or editing

### For Best Video Quality

- Describe motion and action clearly
- Specify time of day, lighting, atmosphere
- Keep prompts focused on a single scene
- Use reference images for consistency
- Use Fast mode for testing, HQ for final output
- Be patient - video generation takes time!

### For Text Chat

- Ask specific questions about your courses
- Mention subject names for context
- Use memory features to save important info
- Review AI responses critically

---

## 🔧 Technical Details

### Models Used

- **Text**: `gemini-2.5-flash`, `gemini-2.5-pro`
- **Image**: `imagen-4.0-generate-001`, `gemini-2.5-flash-image`
- **Video**: `veo-3.1-fast-generate-preview`, `veo-3.1-generate-preview`

### Supported Formats

- **Images**: JPEG, PNG (base64 embedded in chat)
- **Videos**: MP4 (downloadable from Google Cloud Storage)

### Limitations

- Video generation takes 2-10 minutes depending on quality
- Free tier limits apply (check your Google AI Studio quota)
- Large images/videos consume more API credits
- Video files are temporarily hosted (download within 7 days)

### Storage

- All generated images are stored in the database as base64
- Videos are stored as download URLs
- Media is linked to conversations for context
- Full chat history maintained with media

---

## 🎨 UI Features

### Mode Selector

- **Text** (Purple): Standard chat with Gemini
- **Image** (Pink): Image generation with Imagen/Nano Banana
- **Video** (Red): Video generation with Veo

### Image Features

- **Lightbox**: Click any image for fullscreen view
- **Download**: Save images to your device
- **Aspect Ratios**: 1:1, 3:4, 4:3, 9:16, 16:9
- **Reference Upload**: Edit existing images (Nano Banana)

### Video Features

- **Inline Player**: Watch videos directly in chat
- **Download**: Save videos to your device
- **Progress Indicator**: Real-time generation status
- **Quality Options**: Fast (2-3 min) or HQ (5-10 min)

### Chat Width Adjustment

- **Narrow**: 768px (default, cozy reading)
- **Wide**: 1024px (more space for media)
- **Full**: 100% width (maximum viewing area)
- Click width button (top-right) to cycle through options

---

## 🔐 Privacy & Security

- All generations are private to your account
- Images stored securely in database (base64)
- Videos use signed URLs with API key
- Conversations can be deleted anytime
- No data shared with third parties

---

## 📊 Pricing Considerations

### Free Tier (Google AI Studio)

- Text chat: ~1500 requests/day
- Image generation: ~100 images/day
- Video generation: ~10 videos/day

### Paid Tier Recommendations

For heavy use:

- Text: Very affordable (~$0.001/request)
- Images: ~$0.04-0.08/image
- Videos: ~$0.50-2.00/video (varies by quality)

**Tip**: Use Fast models for testing, Pro/HQ for final outputs!

---

## 🐛 Troubleshooting

### Image Generation Failed

- Check your Google AI API quota
- Try a simpler prompt
- Switch to Nano Banana model
- Verify internet connection

### Video Generation Timeout

- Use Fast mode instead of HQ
- Simplify the prompt
- Remove reference images
- Try during off-peak hours

### Chat Not Responding

- Check Railway database connection
- Verify Gemini API key in .env
- Clear browser cache
- Check console for errors

---

## 🚀 Future Roadmap

### Planned Features

- [ ] Audio generation (Gemini TTS)
- [ ] Live video conversations (Gemini Live API)
- [ ] Batch image generation
- [ ] Video-to-video editing
- [ ] Image-to-video conversion
- [ ] Custom model fine-tuning
- [ ] Collaborative generation (share prompts)

### Experimental Features (Coming Soon)

- Multi-speaker audio dialogues
- Real-time audio conversations
- Code execution in chat
- Function calling for dynamic queries

---

## 📚 Resources

### Documentation

- [Gemini API Docs](https://ai.google.dev/docs)
- [Imagen 4.0 Guide](https://ai.google.dev/docs/imagen)
- [Veo Video Generation](https://ai.google.dev/docs/veo)
- [Nano Banana (Flash Image)](https://ai.google.dev/docs/flash-image)

### Community

- GitHub: [AmityMate.ai Repository](https://github.com/yourusername/exam-predictor)
- Issues: Report bugs and request features
- Discussions: Share prompts and tips

---

## 🎓 For Students

### Study Use Cases

- **Visual Flashcards**: Generate images for memory retention
- **Concept Diagrams**: Create flowcharts, mind maps, system diagrams
- **Video Tutorials**: Generate animated explanations
- **Practice Materials**: Image-based questions and scenarios

### Exam Prep

- Use text chat for Q&A and concept clarification
- Generate visual aids for complex topics
- Create video summaries of key concepts
- Build personalized study materials

---

## ⚡ Performance Tips

1. **Use the right model for the job**:

   - Text: Use Flash for speed, Pro for depth
   - Image: Use Nano for speed, Imagen for quality
   - Video: Use Fast for iterations, HQ for finals

2. **Optimize prompts**:

   - Be specific but concise
   - Include all necessary details upfront
   - Use reference images when available

3. **Manage conversations**:
   - Delete old conversations to reduce clutter
   - Use meaningful titles
   - Archive important generations

---

## 🎉 Get Started!

1. Open AmityMate.ai chat
2. Click **Image** or **Video** mode
3. Describe what you want to create
4. Click generate and watch the magic happen!

**Happy creating! 🚀✨**

---

_Built with ❤️ by AmityMate.ai Team_
_Powered by Google Gemini, Imagen, and Veo_
