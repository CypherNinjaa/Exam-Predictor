# 🎯 Project Roadmap: AI Exam Predictor (Gemini 3.0)

> **An intelligent system that predicts future exam questions using historical data, syllabus constraints, and lecture notes powered by Gemini 3.0's advanced reasoning capabilities.**

---

## 📋 Table of Contents

- [Objective](#-objective)
- [Data Structure](#-data-structure-amity-university-patna)
- [Phase 1: Data Ingestion & Transformation](#-phase-1-data-ingestion--transformation-weeks-1-2)
- [Phase 2: Knowledge Infrastructure](#-phase-2-the-knowledge-infrastructure-week-3)
- [Phase 3: Prediction Core](#-phase-3-the-prediction-core-weeks-4-5)
- [Phase 4: Validation & User Interface](#-phase-4-validation--user-interface-week-6)
- [Tech Stack](#-tech-stack-recommendation)
- [Deployment Strategy](#-deployment-strategy)
- [Timeline Summary](#-timeline-summary)

---

## 🎯 Objective

To build an intelligent system that:

- **Ingests** historical exam data, syllabus constraints, and lecture notes
- **Analyzes** patterns, frequencies, and topic distributions
- **Predicts** future exam questions probabilistically using Gemini 3.0's reasoning capabilities

### Key Success Metrics

| Metric              | Target                  |
| ------------------- | ----------------------- |
| Prediction Accuracy | ≥70% topic match        |
| Question Coverage   | ≥80% of syllabus mapped |
| Processing Speed    | <5 min per exam paper   |
| User Satisfaction   | ≥4.5/5 rating           |

---

## 🏫 Data Structure (Amity University Patna)

> **Hierarchical organization of exam data specific to Amity University's academic structure**

### University Hierarchy

```
🏛️ Amity University Patna
└── 📅 Academic Year (2020, 2021, 2022, 2023, 2024, 2025)
    └── 📚 Semester (1-8)
        └── 📖 Subject/Course
            └── 📋 Complete Syllabus
                └── 📝 Exam Type
                    ├── 🔵 Midterm 1 (MT1)
                    ├── 🟡 Midterm 2 (MT2)
                    └── 🔴 End Term (Final Exam)
                        └── ❓ Questions with Metadata
```

### Exam Structure at Amity

| Exam Type     | Timing          | Weightage | Typical Marks | Coverage      |
| ------------- | --------------- | --------- | ------------- | ------------- |
| **Midterm 1** | ~Week 6         | 15-20%    | 20-30 marks   | Modules 1-2   |
| **Midterm 2** | ~Week 12        | 15-20%    | 20-30 marks   | Modules 3-4   |
| **End Term**  | End of Semester | 50-60%    | 60-80 marks   | Full Syllabus |

### Data Hierarchy Example

```
Amity University Patna
├── 2024
│   ├── Semester 5
│   │   ├── Computer Networks (CSE301)
│   │   │   ├── Syllabus
│   │   │   │   ├── Module 1: Network Fundamentals
│   │   │   │   ├── Module 2: Data Link Layer
│   │   │   │   ├── Module 3: Network Layer
│   │   │   │   ├── Module 4: Transport Layer
│   │   │   │   └── Module 5: Application Layer
│   │   │   └── Exams
│   │   │       ├── Midterm 1 (Modules 1-2)
│   │   │       ├── Midterm 2 (Modules 3-4)
│   │   │       └── End Term (All Modules)
│   │   ├── Database Systems (CSE302)
│   │   └── ... more subjects
│   └── Semester 6
└── 2025
    └── ...
```

### Key Insights for Prediction

| Exam Type     | Prediction Strategy                                                  |
| ------------- | -------------------------------------------------------------------- |
| **Midterm 1** | Focus on recent lectures, Modules 1-2 only, shorter questions        |
| **Midterm 2** | Modules 3-4, may reference MT1 concepts, moderate difficulty         |
| **End Term**  | Full syllabus coverage, higher-order thinking, integrative questions |

> 💡 **Important:** End Term exams often include topics from MT1/MT2 that students struggled with (based on class performance), making cross-exam analysis valuable.

---

## 📥 Phase 1: Data Ingestion & Transformation (Weeks 1-2)

> **Goal:** Turn messy PDFs into a clean, structured database.

### 1.1 The Scraper & OCR Pipeline

Most exam papers are scanned images or unselectable PDFs — you cannot simply copy-paste them.

#### The Problem

```
📄 Scanned PDF → 🖼️ Image-based content → ❌ No text extraction possible
```

#### The Solution

**Action:** Write a Python script using **Gemini 3.0 Pro Vision**

```python
# Conceptual Pipeline
pdf_pages = extract_pages_as_images(exam_pdf)
for page in pdf_pages:
    response = gemini_vision.analyze(
        image=page,
        prompt=EXTRACTION_PROMPT
    )
    save_to_raw_data(response)
```

**Prompt Engineering:**

```
"Extract the questions from this image. For each question, identify:
- Question Number
- Marks Allocated
- The exact Text

Return as JSON format."
```

#### Deliverables

| Deliverable        | Description                       |
| ------------------ | --------------------------------- |
| `pdf_extractor.py` | Core extraction script            |
| `raw_data/` folder | JSON files for 5-7 years of exams |
| `extraction_logs/` | Processing status and error logs  |

#### Week 1 Tasks

- [ ] Set up Gemini 3.0 Pro Vision API access
- [ ] Build PDF to image conversion pipeline
- [ ] Design extraction prompt templates
- [ ] Process sample exam papers (2-3 papers)
- [ ] Validate extraction accuracy

---

### 1.2 The "Tagger" (Metadata Enrichment)

Raw text is useless for prediction — you need **rich metadata**.

#### The Enrichment Flow

```
Raw Question → Gemini 3.0 Flash → Enriched Question with Metadata
                    ↑
            University Syllabus
            (Ground Truth)
```

**Action:** Feed extracted questions into **Gemini 3.0 Flash** (faster/cheaper)

**Context:** Provide the official University Syllabus as "Ground Truth"

**Prompt:**

```
"Map this question to a specific Module and Sub-topic in the syllabus.
Classify its Bloom's Taxonomy level (Recall, Apply, Analyze, Create)."
```

#### Output Schema (Amity University Format)

```json
{
	"question_id": "AMITY_2024_SEM5_CSE301_MT1_Q4b",
	"text": "Explain the working of CSMA/CD protocol with diagram.",
	"college": "Amity University Patna",
	"year": 2024,
	"semester": 5,
	"subject_code": "CSE301",
	"subject_name": "Computer Networks",
	"exam_type": "MIDTERM_1",
	"module": "Module 2",
	"topic": "Data Link Layer",
	"sub_topic": "MAC Protocols",
	"cognitive_level": "Understanding",
	"blooms_taxonomy": "Understand",
	"marks": 5,
	"difficulty": "Medium",
	"keywords": ["CSMA/CD", "collision detection", "MAC"],
	"similar_questions": []
}
```

#### Bloom's Taxonomy Classification Guide

| Level          | Keywords                         | Example                         |
| -------------- | -------------------------------- | ------------------------------- |
| **Remember**   | Define, List, State              | "Define entropy"                |
| **Understand** | Explain, Describe, Summarize     | "Explain the concept of..."     |
| **Apply**      | Calculate, Derive, Solve         | "Derive the equation for..."    |
| **Analyze**    | Compare, Contrast, Differentiate | "Compare RSA and DH..."         |
| **Evaluate**   | Justify, Critique, Assess        | "Evaluate the efficiency of..." |
| **Create**     | Design, Propose, Construct       | "Design a system that..."       |

#### Week 2 Tasks

- [ ] Obtain and digitize university syllabus
- [ ] Build tagging pipeline with Gemini Flash
- [ ] Create validation dataset (manually tagged questions)
- [ ] Achieve ≥90% tagging accuracy
- [ ] Process all historical exam data

---

## 🗄️ Phase 2: The Knowledge Infrastructure (Week 3)

> **Goal:** Create a database that allows for time-series querying and semantic search.

### 2.1 Hybrid Storage Strategy

You need **two types of storage** for different query patterns:

```
┌─────────────────────────────────────────────────────────────┐
│                    HYBRID STORAGE LAYER                      │
├─────────────────────────┬───────────────────────────────────┤
│     VECTOR DATABASE     │      RELATIONAL DATABASE          │
│      (ChromaDB)         │        (PostgreSQL)               │
├─────────────────────────┼───────────────────────────────────┤
│ • Semantic search       │ • Trend analysis                  │
│ • Similar questions     │ • Frequency queries               │
│ • Topic clustering      │ • Time-series data                │
│ • Fuzzy matching        │ • Aggregations & reports          │
└─────────────────────────┴───────────────────────────────────┘
```

#### Vector Database (ChromaDB/Pinecone)

**Use Case:** Finding questions semantically similar to "entropy in thermodynamics"

```python
# Semantic Search Example
similar_questions = vector_db.query(
    query_text="entropy calculation in closed systems",
    n_results=5,
    filter={"module": "Module 3"}
)
```

#### SQL Database (PostgreSQL)

**Use Case:** Finding frequency of "Module 4" questions over time

```sql
-- Trend Analysis Query
SELECT
    year,
    topic,
    COUNT(*) as question_count,
    AVG(marks) as avg_marks
FROM questions
WHERE module = 'Module 4'
GROUP BY year, topic
ORDER BY year DESC;
```

#### Database Schema with Prisma ORM

> **Why Prisma?** Type-safe database access, auto-generated migrations, excellent TypeScript/JavaScript support, and visual database management with Prisma Studio.

##### Prisma Schema (`prisma/schema.prisma`)

```prisma
// Prisma Schema for AI Exam Predictor
// Amity University Patna Data Structure

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== CORE ENTITIES ====================

model College {
  id        String   @id @default(cuid())
  name      String   @unique  // "Amity University Patna"
  code      String   @unique  // "AUP"
  location  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  years     AcademicYear[]
  subjects  Subject[]
}

model AcademicYear {
  id        String   @id @default(cuid())
  year      Int      // 2024, 2025
  collegeId String
  createdAt DateTime @default(now())

  // Relations
  college   College    @relation(fields: [collegeId], references: [id])
  semesters Semester[]

  @@unique([collegeId, year])
}

model Semester {
  id             String   @id @default(cuid())
  number         Int      // 1-8
  academicYearId String
  startDate      DateTime?
  endDate        DateTime?
  createdAt      DateTime @default(now())

  // Relations
  academicYear   AcademicYear     @relation(fields: [academicYearId], references: [id])
  subjectOffers  SubjectOffering[]
  exams          Exam[]

  @@unique([academicYearId, number])
}

model Subject {
  id          String   @id @default(cuid())
  code        String   // "CSE301"
  name        String   // "Computer Networks"
  credits     Int      @default(3)
  collegeId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  college     College           @relation(fields: [collegeId], references: [id])
  offerings   SubjectOffering[]
  syllabi     Syllabus[]

  @@unique([collegeId, code])
}

model SubjectOffering {
  id         String   @id @default(cuid())
  subjectId  String
  semesterId String
  createdAt  DateTime @default(now())

  // Relations
  subject    Subject   @relation(fields: [subjectId], references: [id])
  semester   Semester  @relation(fields: [semesterId], references: [id])
  exams      Exam[]

  @@unique([subjectId, semesterId])
}

// ==================== SYLLABUS ====================

model Syllabus {
  id          String   @id @default(cuid())
  subjectId   String
  version     String   @default("1.0")  // Syllabus can change yearly
  year        Int      // Which year this syllabus is for
  description String?
  pdfUrl      String?  // Link to official syllabus PDF
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  subject     Subject  @relation(fields: [subjectId], references: [id])
  modules     Module[]

  @@unique([subjectId, year])
}

model Module {
  id          String   @id @default(cuid())
  number      Int      // Module 1, 2, 3...
  name        String   // "Network Fundamentals"
  description String?
  syllabusId  String
  weightage   Float?   // Percentage of syllabus (e.g., 20%)
  createdAt   DateTime @default(now())

  // Relations
  syllabus    Syllabus   @relation(fields: [syllabusId], references: [id])
  topics      Topic[]
  questions   Question[]

  @@unique([syllabusId, number])
}

model Topic {
  id              String   @id @default(cuid())
  name            String   // "OSI Model"
  description     String?
  moduleId        String
  lastAskedDate   DateTime?
  timesAsked      Int      @default(0)
  freshnessScore  Float    @default(0.5)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  module          Module     @relation(fields: [moduleId], references: [id])
  subTopics       SubTopic[]
  questions       Question[]
}

model SubTopic {
  id        String   @id @default(cuid())
  name      String   // "Layer Functions"
  topicId   String
  createdAt DateTime @default(now())

  // Relations
  topic     Topic      @relation(fields: [topicId], references: [id])
  questions Question[]
}

// ==================== EXAMS & QUESTIONS ====================

enum ExamType {
  MIDTERM_1   // First internal exam
  MIDTERM_2   // Second internal exam
  END_TERM    // Final semester exam
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

enum BloomsTaxonomy {
  REMEMBER
  UNDERSTAND
  APPLY
  ANALYZE
  EVALUATE
  CREATE
}

model Exam {
  id               String   @id @default(cuid())
  examType         ExamType
  semesterId       String
  subjectOfferingId String
  examDate         DateTime?
  totalMarks       Int      @default(60)
  duration         Int      @default(180)  // minutes
  pdfUrl           String?  // Original exam paper
  isProcessed      Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  semester         Semester        @relation(fields: [semesterId], references: [id])
  subjectOffering  SubjectOffering @relation(fields: [subjectOfferingId], references: [id])
  questions        Question[]

  @@unique([subjectOfferingId, examType])
}

model Question {
  id              String          @id @default(cuid())
  questionNumber  String          // "Q1a", "Q4b"
  text            String          // Full question text
  marks           Int
  examId          String
  moduleId        String?
  topicId         String?
  subTopicId      String?
  difficulty      Difficulty      @default(MEDIUM)
  bloomsLevel     BloomsTaxonomy  @default(UNDERSTAND)
  keywords        String[]        // ["OSI", "layers", "protocol"]
  vectorId        String?         // ChromaDB vector reference
  imageUrl        String?         // If question has diagrams
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relations
  exam            Exam       @relation(fields: [examId], references: [id])
  module          Module?    @relation(fields: [moduleId], references: [id])
  topic           Topic?     @relation(fields: [topicId], references: [id])
  subTopic        SubTopic?  @relation(fields: [subTopicId], references: [id])
  predictions     PredictionQuestion[]
}

// ==================== PREDICTIONS ====================

model Prediction {
  id              String   @id @default(cuid())
  targetExamType  ExamType
  targetYear      Int
  targetSemester  Int
  subjectCode     String
  generatedAt     DateTime @default(now())
  confidence      Float    // Overall prediction confidence
  modelVersion    String   @default("1.0")
  isValidated     Boolean  @default(false)
  accuracyScore   Float?   // Filled after exam happens

  // Relations
  questions       PredictionQuestion[]
}

model PredictionQuestion {
  id              String   @id @default(cuid())
  predictionId    String
  generatedText   String   // AI-generated question
  probability     Float    // 0.0 - 1.0
  reasoning       String[] // Why this was predicted
  suggestedMarks  Int
  targetModule    String?
  targetTopic     String?
  wasAccurate     Boolean? // Filled after validation
  matchedQuestionId String? // Actual question it matched
  createdAt       DateTime @default(now())

  // Relations
  prediction      Prediction @relation(fields: [predictionId], references: [id])
  matchedQuestion Question?  @relation(fields: [matchedQuestionId], references: [id])
}

// ==================== LECTURE NOTES (Alpha Signal) ====================

model LectureNote {
  id          String   @id @default(cuid())
  subjectCode String
  semester    Int
  year        Int
  content     String   // Extracted text from lecture
  sourceType  String   // "pdf", "ppt", "transcript"
  sourceUrl   String?
  keywords    Json     // { "keyword": frequency }
  createdAt   DateTime @default(now())

  @@index([subjectCode, year, semester])
}
```

##### Prisma Setup Commands

```bash
# Install Prisma
npm install prisma @prisma/client

# Initialize Prisma (creates prisma/schema.prisma)
npx prisma init

# After defining schema, create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (Visual DB Editor)
npx prisma studio
```

##### Example Prisma Queries

```typescript
import { PrismaClient, ExamType } from "@prisma/client";

const prisma = new PrismaClient();

// Get all Midterm 1 questions for a subject
const mt1Questions = await prisma.question.findMany({
	where: {
		exam: {
			examType: ExamType.MIDTERM_1,
			subjectOffering: {
				subject: { code: "CSE301" },
			},
		},
	},
	include: {
		topic: true,
		module: true,
	},
	orderBy: { createdAt: "desc" },
});

// Get topic frequency analysis
const topicStats = await prisma.topic.findMany({
	where: {
		module: {
			syllabus: {
				subject: { code: "CSE301" },
			},
		},
	},
	select: {
		name: true,
		timesAsked: true,
		freshnessScore: true,
		lastAskedDate: true,
		_count: { select: { questions: true } },
	},
	orderBy: { freshnessScore: "desc" },
});

// Get exam pattern by exam type
const examPattern = await prisma.exam.findMany({
	where: {
		examType: ExamType.END_TERM,
		subjectOffering: {
			subject: { code: "CSE301" },
		},
	},
	include: {
		questions: {
			include: { module: true, topic: true },
		},
	},
	orderBy: {
		semester: { academicYear: { year: "desc" } },
	},
});
```

---

### 2.2 The "Gap Analysis" Engine

**Action:** Build a query engine that identifies what is **missing** from recent exams.

#### The Logic Flow

```
1. Fetch ALL topics in Module X from syllabus
           ↓
2. Fetch ALL questions from Module X (last 3 years)
           ↓
3. Calculate "Freshness Score" for each topic
           ↓
4. Identify HIGH-PROBABILITY topics (not asked recently)
```

#### Freshness Score Algorithm

```python
def calculate_freshness_score(topic: str, years_data: list) -> float:
    """
    Higher score = More likely to appear

    Factors:
    - Years since last asked
    - Importance weight in syllabus
    - Historical frequency
    """
    years_since_asked = current_year - last_asked_year
    syllabus_weight = get_syllabus_weight(topic)  # 0.0 - 1.0
    historical_frequency = questions_count / total_questions

    freshness_score = (
        (years_since_asked * 0.4) +
        (syllabus_weight * 0.35) +
        ((1 - historical_frequency) * 0.25)
    )

    return min(freshness_score, 1.0)
```

#### Gap Analysis Output Example

| Topic           | Last Asked | Frequency | Freshness Score | Priority  |
| --------------- | ---------- | --------- | --------------- | --------- |
| Neural Networks | 2021       | 2/15      | 0.89            | 🔴 HIGH   |
| RSA Encryption  | 2024       | 5/15      | 0.32            | 🟢 LOW    |
| Transformers    | 2022       | 1/15      | 0.91            | 🔴 HIGH   |
| TCP/IP          | 2023       | 4/15      | 0.45            | 🟡 MEDIUM |

#### Week 3 Tasks

- [ ] Set up PostgreSQL database
- [ ] Initialize ChromaDB vector store
- [ ] Implement data ingestion pipelines
- [ ] Build freshness score calculator
- [ ] Create gap analysis API endpoints
- [ ] Test with sample data

---

## 🧠 Phase 3: The Prediction Core (Weeks 4-5)

> **Goal:** Use Gemini 3.0 "Deep Think" to simulate the professor's question-setting patterns.

### 3.1 The Pattern Recognition Agent

**Input:** SQL data showing the historical pattern of topics

#### Pattern Analysis Tasks

```python
patterns_to_detect = [
    "topic_alternation",      # Does RSA alternate with Diffie-Hellman?
    "difficulty_balance",     # Hard Q in Section A → Easy Q in Section B?
    "mark_distribution",      # How are marks distributed across modules?
    "question_type_cycles",   # Theory → Numerical → Theory pattern?
    "professor_preferences"   # Specific phrasing or topics favored?
]
```

**Gemini 3.0 Task:**

```
"Analyze the pattern of 'Network Security' questions over the past 5 years.

Consider:
1. Do topics like 'RSA' and 'Diffie-Hellman' alternate?
2. Is there a correlation between 'Hard' questions in Section A and 'Easy' questions in Section B?
3. What cognitive levels dominate this module?
4. Are there any numerical vs theoretical patterns?

Provide a 'Ruleset' for predicting the current year's exam."
```

**Output: The Ruleset**

```json
{
	"module": "Network Security",
	"year": 2025,
	"rules": [
		{
			"rule_id": "NS_R1",
			"description": "Expect a 10-mark question on Cryptography",
			"confidence": 0.85,
			"reasoning": "RSA appeared in 2023, DH in 2024, pattern suggests RSA return"
		},
		{
			"rule_id": "NS_R2",
			"description": "Section B will have 2 numerical problems",
			"confidence": 0.72,
			"reasoning": "Last 4 years consistently had 2 numerical problems"
		}
	],
	"predicted_topics": ["RSA", "Digital Signatures", "SSL/TLS"],
	"avoid_topics": ["Diffie-Hellman", "Kerberos"]
}
```

---

### 3.2 The Lecture Note Weigher (The "Alpha" Signal)

This is your **competitive edge** — current semester signals that historical data doesn't capture.

**Action:** Ingest current semester lecture notes/transcripts

#### Analysis Pipeline

```
Current Semester Notes    Previous Year Notes
        ↓                         ↓
   Keyword Extraction        Keyword Extraction
        ↓                         ↓
        └──────── Compare ────────┘
                    ↓
           Frequency Delta Analysis
                    ↓
           "Alpha" Signal Generation
```

**Hypothesis:**

> If the professor mentioned "Neural Networks" **50% more** this year than last year, the probability of a question on that topic **spikes significantly**.

#### Keyword Frequency Analysis

```python
def calculate_alpha_signal(current_notes: str, previous_notes: str) -> dict:
    """
    Compare keyword frequencies between current and previous years.
    """
    current_freq = extract_keyword_frequencies(current_notes)
    previous_freq = extract_keyword_frequencies(previous_notes)

    alpha_signals = {}
    for keyword in current_freq:
        if keyword in previous_freq:
            delta = (current_freq[keyword] - previous_freq[keyword]) / previous_freq[keyword]
            if delta > 0.3:  # 30% increase threshold
                alpha_signals[keyword] = {
                    "delta": delta,
                    "signal_strength": "HIGH" if delta > 0.5 else "MEDIUM",
                    "prediction_boost": delta * 0.4
                }

    return alpha_signals
```

#### Example Alpha Signal Output

| Keyword             | 2024 Mentions | 2025 Mentions | Delta | Signal      |
| ------------------- | ------------- | ------------- | ----- | ----------- |
| Transformers        | 12            | 28            | +133% | 🔴 STRONG   |
| Attention Mechanism | 8             | 19            | +137% | 🔴 STRONG   |
| CNN                 | 25            | 22            | -12%  | ⚪ NONE     |
| LSTM                | 15            | 8             | -47%  | 🔵 NEGATIVE |

---

### 3.3 The Generator Agent

**Action:** Combine the **Ruleset** (3.1) and the **Freshness Score** (2.2) with **Alpha Signals** (3.2)

#### Prediction Formula

```
Final Probability = (
    Base Freshness Score × 0.35 +
    Pattern Rule Match × 0.30 +
    Alpha Signal Boost × 0.25 +
    Historical Frequency × 0.10
)
```

#### Question Generation Prompt

```
"Generate 3 predicted questions for Module 5: Deep Learning.

Constraints:
- Cognitive Level: 'Analysis' (Bloom's Taxonomy)
- Topic Focus: 'Transformers' (High Alpha Signal)
- Mark Range: 8-12 marks
- Style: Match the phrasing style of the 2023 paper

Reference Style Examples:
[Insert 2-3 actual questions from 2023 paper]

Requirements:
1. Questions must be answerable from the syllabus
2. Include mark allocation
3. Provide expected answer outline
"
```

#### Generated Question Example

```json
{
	"question_id": "PRED_2025_M5_Q1",
	"text": "Compare and contrast the self-attention mechanism in Transformers with the attention mechanism used in sequence-to-sequence models. Illustrate with a suitable diagram. [10 marks]",
	"predicted_probability": 0.78,
	"topic": "Transformers",
	"cognitive_level": "Analyze",
	"confidence": "HIGH",
	"supporting_evidence": [
		"Topic not asked in 2 years (Freshness: 0.85)",
		"133% increase in lecture mentions (Alpha: HIGH)",
		"Pattern shows alternating DL topics"
	],
	"expected_answer_points": [
		"Definition of self-attention",
		"Comparison with traditional attention",
		"Diagram of multi-head attention",
		"Advantages of self-attention"
	]
}
```

#### Week 4-5 Tasks

- [ ] Build pattern recognition agent
- [ ] Implement lecture note analyzer
- [ ] Create alpha signal calculator
- [ ] Develop question generator agent
- [ ] Build prediction probability calculator
- [ ] Integrate all components with LangChain
- [ ] Test prediction pipeline end-to-end

---

## ✅ Phase 4: Validation & User Interface (Week 6)

> **Goal:** Verify prediction accuracy and create a user-friendly interface.

### 4.1 "Backtesting" (Crucial Step)

Before trusting the 2025 predictions, **validate the model on historical data**.

#### Backtesting Strategy

```
Training Data: 2018 - 2022
        ↓
   Run Prediction Model
        ↓
Predict 2023 Exam Questions
        ↓
Compare with Actual 2023 Paper
        ↓
Calculate Accuracy Metrics
        ↓
   Refine Prompting Strategy
```

#### Accuracy Metrics

| Metric                  | Formula                                     | Target |
| ----------------------- | ------------------------------------------- | ------ |
| **Topic Hit Rate**      | Correct Topics / Total Predicted            | ≥70%   |
| **Question Similarity** | Cosine similarity of generated vs actual    | ≥0.65  |
| **Difficulty Match**    | Correct difficulty / Total                  | ≥75%   |
| **Module Coverage**     | Modules correctly predicted / Total Modules | ≥80%   |

#### Refinement Process

```python
def backtest_and_refine(training_years: list, test_year: int):
    """
    Iterative refinement loop
    """
    for iteration in range(MAX_ITERATIONS):
        # Generate predictions
        predictions = generate_predictions(training_years)

        # Compare with actual
        actual = load_actual_exam(test_year)
        metrics = calculate_accuracy(predictions, actual)

        # Analyze failures
        failures = analyze_failures(predictions, actual)

        # Refine prompts based on failure patterns
        refined_prompts = refine_prompts(failures)

        if metrics['topic_hit_rate'] >= 0.70:
            break

    return refined_prompts, metrics
```

#### Common Failure Patterns & Fixes

| Failure Pattern             | Cause                     | Fix                         |
| --------------------------- | ------------------------- | --------------------------- |
| Over-predicting rare topics | High freshness score bias | Reduce freshness weight     |
| Missing numerical questions | Text-focused analysis     | Add question-type detection |
| Wrong difficulty level      | Poor bloom classification | Improve taxonomy prompts    |
| Missed professor style      | Generic generation        | Add more style examples     |

---

### 4.2 The User Interface

**Tech Stack:** Streamlit (Python) for rapid development

#### Core Features

```
┌─────────────────────────────────────────────────────────────┐
│                    AI EXAM PREDICTOR                         │
├─────────────────────────────────────────────────────────────┤
│  📊 PROBABILITY HEATMAP                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Module 1: ████████░░ 80%  Module 4: ██████░░░░ 60%     ││
│  │ Module 2: ████░░░░░░ 40%  Module 5: █████████░ 90%     ││
│  │ Module 3: ███████░░░ 70%  Module 6: ███░░░░░░░ 30%     ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  🎯 TOP PREDICTED QUESTIONS                                  │
│  1. Transformers & Self-Attention (92% confidence)          │
│  2. RSA Digital Signatures (85% confidence)                 │
│  3. TCP Congestion Control (78% confidence)                 │
├─────────────────────────────────────────────────────────────┤
│  [📝 Generate Mock Exam]  [📈 View Trends]  [⚙️ Settings]   │
└─────────────────────────────────────────────────────────────┘
```

#### Feature Breakdown

##### 1. Probability Heatmap

- Visual syllabus showing topic probabilities
- Color coding: 🔴 High (>70%) | 🟡 Medium (40-70%) | 🟢 Low (<40%)
- Click-through to detailed topic analysis

##### 2. Mock Exam Generator

```python
def generate_mock_exam(config: ExamConfig) -> MockExam:
    """
    Assembles a full exam paper based on predictions
    """
    return MockExam(
        duration=config.duration,  # e.g., "3 hours"
        sections=assemble_sections(config),
        total_marks=config.total_marks,
        instructions=generate_instructions(),
        answer_key=generate_answer_outlines()
    )
```

##### 3. Historical Trends Dashboard

- Year-over-year topic frequency charts
- Difficulty distribution graphs
- Module weightage trends

##### 4. Confidence Explanations

- For each prediction, show **why** it was predicted
- Evidence trail: Freshness + Patterns + Alpha Signals

#### UI Wireframes

```
┌─ Dashboard ────────────────────────────────────────────────┐
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ Questions    │ │ Topics       │ │ Accuracy     │        │
│ │ Analyzed     │ │ Covered      │ │ Score        │        │
│ │    247       │ │    42/48     │ │   76.3%      │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                            │
│ ┌─ Probability Heatmap ──────────────────────────────────┐│
│ │ [Interactive Syllabus Map with Color-Coded Topics]     ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌─ Predicted Questions ─────────┐ ┌─ Quick Actions ──────┐│
│ │ 1. Question about X... (92%)  │ │ [Generate Mock Exam] ││
│ │ 2. Question about Y... (85%)  │ │ [Export Predictions] ││
│ │ 3. Question about Z... (78%)  │ │ [View Full Report]   ││
│ └───────────────────────────────┘ └──────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

#### Week 6 Tasks

- [ ] Implement backtesting framework
- [ ] Run validation on historical data
- [ ] Refine prompts based on results
- [ ] Build Streamlit dashboard
- [ ] Create probability heatmap component
- [ ] Implement mock exam generator
- [ ] Add export functionality (PDF/JSON)
- [ ] User testing and feedback

---

## 🛠️ Tech Stack Recommendation

| Component         | Technology                                       | Justification                                           |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------- |
| **LLM**           | Gemini 3.0 Pro                                   | Best-in-class reasoning + multimodal (Vision for OCR)   |
| **LLM (Fast)**    | Gemini 3.0 Flash                                 | Cost-effective for tagging operations                   |
| **Backend**       | Node.js (Next.js API Routes) or Python (FastAPI) | Prisma works natively with Node.js                      |
| **ORM**           | **Prisma**                                       | Type-safe, auto migrations, excellent DX, Prisma Studio |
| **Vector DB**     | ChromaDB                                         | Open-source, local development friendly                 |
| **SQL DB**        | PostgreSQL                                       | Robust, excellent for time-series queries               |
| **Orchestration** | LangChain.js or LangChain (Python)               | Agent management, chain composition                     |
| **Frontend**      | Next.js + Tailwind or Streamlit                  | Modern React-based UI                                   |
| **Deployment**    | Railway.com                                      | Simple deployment, good free tier                       |

### Why Prisma Over Raw SQL?

| Feature          | Raw SQL               | Prisma                    |
| ---------------- | --------------------- | ------------------------- |
| Type Safety      | ❌ Runtime errors     | ✅ Compile-time checks    |
| Migrations       | Manual SQL files      | ✅ Auto-generated         |
| Relations        | Manual JOINs          | ✅ Automatic includes     |
| Visual Editor    | ❌ Need separate tool | ✅ Prisma Studio built-in |
| Query Building   | String concatenation  | ✅ Fluent API             |
| Multi-DB Support | Per-DB syntax         | ✅ Same code, any DB      |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                             │
│                    (Next.js + Tailwind / Streamlit)                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           FASTAPI BACKEND                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ Ingestion   │  │ Analysis    │  │ Prediction  │  │ Generation │ │
│  │ API         │  │ API         │  │ API         │  │ API        │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└────────┬─────────────────┬─────────────────┬─────────────┬──────────┘
         │                 │                 │             │
         ▼                 ▼                 ▼             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         LANGCHAIN ORCHESTRATION                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │ OCR Agent       │  │ Pattern Agent   │  │ Generator Agent     │  │
│  │ (Gemini Vision) │  │ (Gemini Pro)    │  │ (Gemini Pro)        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
└────────┬─────────────────────────────────────────────────┬──────────┘
         │                                                 │
         ▼                                                 ▼
┌─────────────────────────────┐       ┌───────────────────────────────┐
│        ChromaDB             │       │         PostgreSQL            │
│     (Vector Store)          │       │      (Structured Data)        │
│  • Question embeddings      │       │  • College/Year/Semester      │
│  • Semantic search          │       │  • Subjects & Syllabi         │
│  • Similarity matching      │       │  • Exams (MT1, MT2, EndTerm)  │
│                             │       │  • Questions & Predictions    │
│                             │       │  • Managed via PRISMA ORM     │
└─────────────────────────────┘       └───────────────────────────────┘
```

---

## 🚀 Deployment Strategy

### Railway.com Configuration

```yaml
# railway.toml
[build]
builder = "dockerfile"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on-failure"

[[services]]
name = "exam-predictor-api"

[[services]]
name = "exam-predictor-ui"
startCommand = "streamlit run app.py --server.port $PORT"
```

### Environment Variables

```bash
# Required Environment Variables
GEMINI_API_KEY=your_gemini_api_key

# PostgreSQL connection string for Prisma
DATABASE_URL="postgresql://user:password@host:5432/exam_predictor?schema=public"

# ChromaDB for vector embeddings
CHROMADB_PATH=/data/chromadb

# App Configuration
SECRET_KEY=your_secret_key
NEXTAUTH_SECRET=your_nextauth_secret
ENVIRONMENT=production

# College Configuration (can support multiple colleges)
DEFAULT_COLLEGE="Amity University Patna"
DEFAULT_COLLEGE_CODE="AUP"
```

### Deployment Checklist

- [ ] Set up Railway.com project
- [ ] Configure PostgreSQL add-on
- [ ] Set environment variables
- [ ] Deploy FastAPI backend
- [ ] Deploy Streamlit frontend
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring/alerts

---

## 📅 Timeline Summary

```
Week 1  ████████░░░░░░░░░░░░░░░░░░░░░░  Phase 1.1: OCR Pipeline
Week 2  ░░░░░░░░████████░░░░░░░░░░░░░░  Phase 1.2: Metadata Tagging
Week 3  ░░░░░░░░░░░░░░░░████████░░░░░░  Phase 2: Database Setup
Week 4  ░░░░░░░░░░░░░░░░░░░░░░░░████░░  Phase 3.1-3.2: Pattern Analysis
Week 5  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░██  Phase 3.3: Generator Agent
Week 6  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Phase 4: Validation & UI
        ████████████████████████████████
```

### Milestone Checkpoints

| Week | Milestone              | Deliverable                             |
| ---- | ---------------------- | --------------------------------------- |
| 2    | Data Pipeline Complete | All historical exams processed & tagged |
| 3    | Infrastructure Ready   | Databases populated, APIs functional    |
| 5    | Prediction Engine Live | End-to-end prediction working           |
| 6    | MVP Launch             | Full application deployed on Railway    |

---

## 📝 Next Steps

### 1. Set up development environment

```bash
# Create Next.js project with TypeScript
npx create-next-app@latest exam-predictor --typescript --tailwind --eslint
cd exam-predictor

# Install Prisma
npm install prisma @prisma/client
npx prisma init

# Install other dependencies
npm install @google/generative-ai langchain chromadb
npm install -D @types/node
```

### 2. Initialize Prisma Database

```bash
# Copy the schema from this roadmap to prisma/schema.prisma
# Then run:
npx prisma migrate dev --name init
npx prisma generate

# Open Prisma Studio to visually manage data
npx prisma studio
```

### 3. Get Gemini API access

- Visit [Google AI Studio](https://makersuite.google.com/)
- Generate API key for Gemini 3.0
- Add to `.env` file as `GEMINI_API_KEY`

### 4. Collect initial data for Amity University Patna

- Gather 5-7 years of past exam papers (MT1, MT2, End Term)
- Obtain official syllabus documents per semester
- Collect current semester lecture notes
- Organize by: `data/AUP/{year}/{semester}/{subject}/{exam_type}/`

### 5. Start Phase 1 development

- Begin with `src/lib/pdf-extractor.ts`
- Test on 2-3 sample papers from Amity
- Seed database with extracted questions

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) for details.

---

> **Built with ❤️ using Gemini 3.0 and Python**
