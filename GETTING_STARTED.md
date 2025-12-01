# 🚀 Getting Started - AI Exam Predictor

> **Step-by-step guide to set up and run the Exam Predictor project**

---

## 📋 Implementation Order (Follow This!)

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION PHASES                         │
├─────────────────────────────────────────────────────────────────┤
│  PHASE 0: Setup (TODAY)                                         │
│  ├── 0.1 Install dependencies                                   │
│  ├── 0.2 Set up PostgreSQL database                             │
│  ├── 0.3 Configure environment variables                        │
│  └── 0.4 Run Prisma migrations                                  │
│                                                                  │
│  PHASE 1: Data Collection (Week 1)                              │
│  ├── 1.1 Collect exam papers (PDFs)                             │
│  ├── 1.2 Collect syllabus documents                             │
│  └── 1.3 Organize folder structure                              │
│                                                                  │
│  PHASE 2: PDF Extraction (Week 1-2)                             │
│  ├── 2.1 Build Gemini Vision extractor                          │
│  ├── 2.2 Test on sample papers                                  │
│  └── 2.3 Store extracted questions in DB                        │
│                                                                  │
│  PHASE 3: Tagging & Analysis (Week 2-3)                         │
│  ├── 3.1 Build metadata tagger                                  │
│  ├── 3.2 Calculate freshness scores                             │
│  └── 3.3 Build gap analysis                                     │
│                                                                  │
│  PHASE 4: Prediction Engine (Week 4-5)                          │
│  ├── 4.1 Pattern recognition                                    │
│  ├── 4.2 Question generator                                     │
│  └── 4.3 Probability calculator                                 │
│                                                                  │
│  PHASE 5: UI & Deployment (Week 6)                              │
│  ├── 5.1 Build Next.js dashboard                                │
│  ├── 5.2 Deploy to Railway                                      │
│  └── 5.3 Testing & validation                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ PHASE 0: Initial Setup (Do This First!)

### Step 0.1: Install Node.js & PostgreSQL

**Prerequisites:**

- Node.js 18+ → [Download](https://nodejs.org/)
- PostgreSQL 15+ → [Download](https://www.postgresql.org/download/)
- Git → [Download](https://git-scm.com/)

### Step 0.2: Clone & Install Dependencies

```bash
# Navigate to your project
cd d:\github\Exam-Predictor

# Install all dependencies
npm install

# This will install:
# - Next.js (Frontend)
# - Prisma (Database ORM)
# - @google/generative-ai (Gemini API)
# - LangChain (AI orchestration)
# - ChromaDB (Vector database)
```

### Step 0.3: Set Up PostgreSQL Database

**Option A: Local PostgreSQL**

```bash
# Create database (run in psql or pgAdmin)
CREATE DATABASE exam_predictor;
```

**Option B: Railway PostgreSQL (Recommended for deployment)**

1. Go to [Railway.app](https://railway.app/)
2. Create new project → Add PostgreSQL
3. Copy the connection string

### Step 0.4: Configure Environment Variables

```bash
# Copy example to .env
copy .env.example .env

# Edit .env with your values:
# - DATABASE_URL: Your PostgreSQL connection string
# - GEMINI_API_KEY: Get from https://makersuite.google.com/
```

### Step 0.5: Initialize Database with Prisma

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Open Prisma Studio (visual database editor)
npm run db:studio
```

🎉 **Checkpoint: You should see Prisma Studio open in your browser!**

---

## 📁 PHASE 1: Data Collection

### Folder Structure to Create

```
data/
├── raw/                          # Original PDFs
│   └── AUP/                      # Amity University Patna
│       └── 2024/
│           └── semester-5/
│               └── CSE301/       # Subject code
│                   ├── syllabus.pdf
│                   ├── midterm-1.pdf
│                   ├── midterm-2.pdf
│                   └── endterm.pdf
│
├── extracted/                    # Extracted JSON
│   └── AUP/
│       └── 2024/
│           └── semester-5/
│               └── CSE301/
│                   ├── midterm-1.json
│                   ├── midterm-2.json
│                   └── endterm.json
│
└── processed/                    # Tagged & enriched data
    └── questions.json
```

### Create Folder Structure

```bash
# Run in PowerShell
mkdir -p data/raw/AUP/2024/semester-5/CSE301
mkdir -p data/raw/AUP/2024/semester-5/CSE302
mkdir -p data/extracted/AUP
mkdir -p data/processed
```

### What to Collect

| Item                         | Priority  | Where to Get                          |
| ---------------------------- | --------- | ------------------------------------- |
| Past 5 years exam papers     | 🔴 HIGH   | Seniors, Library, Google Drive groups |
| Current semester syllabus    | 🔴 HIGH   | University portal, Faculty            |
| Lecture notes/PPTs           | 🟡 MEDIUM | Class groups, LMS                     |
| Previous year question banks | 🟢 LOW    | Study materials                       |

---

## 💻 PHASE 2: Build PDF Extractor (First Code!)

### Step 2.1: Create the Gemini Vision Extractor

Create file: `src/lib/gemini.ts`

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// For OCR/Vision tasks
export const geminiVision = genAI.getGenerativeModel({
	model: "gemini-1.5-pro",
});

// For text analysis (faster, cheaper)
export const geminiFlash = genAI.getGenerativeModel({
	model: "gemini-1.5-flash",
});

export { genAI };
```

### Step 2.2: Create PDF Extraction Script

Create file: `src/scripts/extract-pdf.ts`

```typescript
import { geminiVision } from "../lib/gemini";
import * as fs from "fs";
import * as path from "path";

const EXTRACTION_PROMPT = `
You are an expert at extracting exam questions from university exam papers.

Analyze this exam paper image and extract ALL questions.

For EACH question, provide:
1. question_number: The exact question number (e.g., "Q1", "Q1a", "Q2b(i)")
2. text: The complete question text
3. marks: Marks allocated (look for [5], (5 marks), etc.)
4. has_subparts: true/false
5. question_type: "theoretical" | "numerical" | "diagram" | "mcq"

Return as JSON array:
[
  {
    "question_number": "Q1a",
    "text": "Explain the OSI model layers...",
    "marks": 5,
    "has_subparts": false,
    "question_type": "theoretical"
  }
]

IMPORTANT: 
- Extract EVERY question, including sub-parts
- Preserve exact wording
- If marks aren't visible, estimate based on question complexity
`;

async function extractFromImage(imagePath: string) {
	const imageData = fs.readFileSync(imagePath);
	const base64Image = imageData.toString("base64");

	const result = await geminiVision.generateContent([
		EXTRACTION_PROMPT,
		{
			inlineData: {
				mimeType: "image/png",
				data: base64Image,
			},
		},
	]);

	const response = result.response.text();

	// Parse JSON from response
	const jsonMatch = response.match(/\[[\s\S]*\]/);
	if (jsonMatch) {
		return JSON.parse(jsonMatch[0]);
	}

	throw new Error("Failed to parse extraction response");
}

// Main execution
async function main() {
	const testImage = process.argv[2];

	if (!testImage) {
		console.log("Usage: npm run extract:pdf <path-to-image>");
		console.log(
			"Example: npm run extract:pdf ./data/raw/AUP/2024/semester-5/CSE301/midterm-1-page1.png"
		);
		return;
	}

	console.log(`Extracting from: ${testImage}`);
	const questions = await extractFromImage(testImage);
	console.log("Extracted Questions:", JSON.stringify(questions, null, 2));
}

main().catch(console.error);
```

### Step 2.3: Test the Extractor

```bash
# First, convert a PDF page to image (use any tool)
# Then run:
npm run extract:pdf ./data/raw/AUP/2024/semester-5/CSE301/page1.png
```

---

## 📊 Quick Start Commands

```bash
# ============ DATABASE ============
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to DB
npm run db:migrate     # Create migration
npm run db:studio      # Open visual DB editor

# ============ DEVELOPMENT ============
npm run dev            # Start Next.js dev server
npm run build          # Build for production
npm run start          # Start production server

# ============ EXTRACTION ============
npm run extract:pdf    # Extract questions from PDF

# ============ TESTING ============
npm run test           # Run tests
```

---

## ✅ Today's Checklist

- [ ] Install Node.js 18+
- [ ] Install PostgreSQL
- [ ] Run `npm install`
- [ ] Create `.env` file with your credentials
- [ ] Run `npm run db:push`
- [ ] Run `npm run db:studio` - verify tables created
- [ ] Create folder structure in `data/`
- [ ] Collect at least 2-3 exam papers (any subject)
- [ ] Get Gemini API key from Google AI Studio

---

## 🆘 Troubleshooting

### "Cannot find module '@prisma/client'"

```bash
npm run db:generate
```

### "Database connection failed"

- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Try: `npx prisma db push --force-reset`

### "GEMINI_API_KEY not found"

- Add to .env file
- Restart terminal/VS Code

### "Permission denied" on Windows

```bash
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 🎯 Next Steps After Setup

1. **Collect Data** → Gather 5+ exam papers for one subject
2. **Test Extraction** → Run extractor on sample paper
3. **Seed Database** → Add college, subjects, syllabus data
4. **Build Tagger** → Create metadata enrichment pipeline
5. **Build UI** → Create Next.js dashboard

---

## 📞 Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [LangChain.js](https://js.langchain.com/)

---

> **Start with Phase 0 today. Once you have the database running and see Prisma Studio, you're ready for Phase 1!**
