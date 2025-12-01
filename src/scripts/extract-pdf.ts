/**
 * PDF Extraction Script using Gemini Vision
 *
 * Usage: npm run extract:pdf <path-to-image>
 * Example: npm run extract:pdf ./data/raw/AUP/2024/semester-5/CSE301/page1.png
 */

import * as fs from "fs";
import * as path from "path";
import { geminiPro } from "../lib/gemini";

// Extraction prompt for exam papers
const EXTRACTION_PROMPT = `
You are an expert at extracting exam questions from university exam papers.
This is an exam paper from Amity University Patna.

Analyze this exam paper image and extract ALL questions with complete accuracy.

For EACH question found, provide:
1. question_number: The exact question number as written (e.g., "Q1", "Q1a", "Q2b(i)", "1.", "1(a)")
2. text: The COMPLETE question text, word for word
3. marks: Marks allocated (look for patterns like [5], (5 marks), (5M), 5 Marks, etc.)
4. has_subparts: true if question has sub-parts (a, b, c or i, ii, iii)
5. question_type: Classify as one of:
   - "theoretical" (explain, describe, define, discuss)
   - "numerical" (calculate, solve, find the value)
   - "diagram" (draw, illustrate, show with diagram)
   - "short_answer" (brief questions, 2-3 marks)
   - "mcq" (multiple choice)
   - "case_study" (scenario-based)

Return ONLY a valid JSON array, no other text:
[
  {
    "question_number": "Q1a",
    "text": "Explain the seven layers of OSI model with their functions.",
    "marks": 5,
    "has_subparts": false,
    "question_type": "theoretical"
  },
  {
    "question_number": "Q1b",
    "text": "Calculate the bandwidth required for transmitting 1000 frames...",
    "marks": 5,
    "has_subparts": false,
    "question_type": "numerical"
  }
]

CRITICAL INSTRUCTIONS:
- Extract EVERY question including all sub-parts
- Preserve exact wording - do not paraphrase
- If marks aren't clearly visible, make a reasonable estimate
- Include any OR options (e.g., "Q3 OR Q3a")
- For diagram questions, describe what needs to be drawn
`;

interface ExtractedQuestion {
	question_number: string;
	text: string;
	marks: number;
	has_subparts: boolean;
	question_type:
		| "theoretical"
		| "numerical"
		| "diagram"
		| "short_answer"
		| "mcq"
		| "case_study";
}

async function extractFromImage(
	imagePath: string
): Promise<ExtractedQuestion[]> {
	// Verify file exists
	if (!fs.existsSync(imagePath)) {
		throw new Error(`File not found: ${imagePath}`);
	}

	// Read and encode image
	const imageData = fs.readFileSync(imagePath);
	const base64Image = imageData.toString("base64");

	// Determine MIME type
	const ext = path.extname(imagePath).toLowerCase();
	const mimeTypes: Record<string, string> = {
		".png": "image/png",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".webp": "image/webp",
	};
	const mimeType = mimeTypes[ext] || "image/png";

	console.log(`📄 Processing: ${path.basename(imagePath)}`);
	console.log(`📊 File size: ${(imageData.length / 1024).toFixed(2)} KB`);

	// Call Gemini Vision
	const result = await geminiPro.generateContent([
		EXTRACTION_PROMPT,
		{
			inlineData: {
				mimeType,
				data: base64Image,
			},
		},
	]);

	const response = result.response.text();

	// Parse JSON from response
	const jsonMatch = response.match(/\[[\s\S]*\]/);
	if (jsonMatch) {
		try {
			const questions = JSON.parse(jsonMatch[0]) as ExtractedQuestion[];
			console.log(`✅ Extracted ${questions.length} questions`);
			return questions;
		} catch (parseError) {
			console.error("❌ JSON Parse Error:", parseError);
			console.log("Raw response:", response);
			throw new Error("Failed to parse JSON response");
		}
	}

	throw new Error("No valid JSON found in response");
}

async function saveExtraction(
	questions: ExtractedQuestion[],
	outputPath: string
): Promise<void> {
	const output = {
		extracted_at: new Date().toISOString(),
		total_questions: questions.length,
		questions,
	};

	fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
	console.log(`💾 Saved to: ${outputPath}`);
}

// Main execution
async function main() {
	console.log("\n🚀 Exam Paper Extractor (Gemini Vision)\n");
	console.log("=".repeat(50));

	const inputPath = process.argv[2];

	if (!inputPath) {
		console.log(`
Usage: npm run extract:pdf <path-to-image>

Examples:
  npm run extract:pdf ./data/raw/AUP/2024/semester-5/CSE301/midterm1-page1.png
  npm run extract:pdf ./test-paper.png

Supported formats: PNG, JPG, JPEG, WEBP

Tips:
  - Convert PDF pages to images first (use pdf2image or online tools)
  - Ensure images are clear and readable
  - Process one page at a time for best results
`);
		return;
	}

	try {
		const questions = await extractFromImage(inputPath);

		// Display extracted questions
		console.log("\n📝 Extracted Questions:\n");
		questions.forEach((q, i) => {
			console.log(
				`${i + 1}. [${q.question_number}] (${q.marks} marks) - ${
					q.question_type
				}`
			);
			console.log(
				`   ${q.text.substring(0, 100)}${q.text.length > 100 ? "..." : ""}\n`
			);
		});

		// Save to JSON
		const outputPath = inputPath.replace(/\.(png|jpg|jpeg|webp)$/i, ".json");
		await saveExtraction(questions, outputPath);

		console.log("\n" + "=".repeat(50));
		console.log("✅ Extraction complete!");
	} catch (error) {
		console.error("\n❌ Error:", error);
		process.exit(1);
	}
}

main();
