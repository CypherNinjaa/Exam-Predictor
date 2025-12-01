/**
 * Script to extract questions from PYQ (Previous Year Questions) PDF
 * Run with: npx ts-node src/scripts/extract-pyq.ts <path-to-pdf>
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const client = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY!,
});

interface ExtractedQuestion {
	questionNumber: string;
	text: string;
	marks: number;
	parts?: {
		partLabel: string;
		text: string;
		marks: number;
	}[];
	section?: string;
	hasOptions?: boolean;
	options?: string[];
	questionType: "SHORT" | "LONG" | "MCQ" | "DESCRIPTIVE";
	difficulty?: "EASY" | "MEDIUM" | "HARD";
}

interface ExtractedPaper {
	examInfo: {
		subjectCode?: string;
		subjectName?: string;
		examType?: string;
		date?: string;
		totalMarks?: number;
		duration?: number;
		semester?: number;
		academicYear?: string;
	};
	instructions?: string[];
	sections: {
		name: string;
		questionType?: string;
		questions: ExtractedQuestion[];
	}[];
	allQuestions: ExtractedQuestion[];
}

async function extractQuestionsFromPDF(
	pdfPath: string
): Promise<ExtractedPaper> {
	console.log(`\n📄 Reading PDF: ${pdfPath}`);

	// Read PDF as base64
	const pdfBuffer = fs.readFileSync(pdfPath);
	const base64Data = pdfBuffer.toString("base64");

	console.log("🤖 Sending to Gemini for extraction...\n");

	const prompt = `You are an expert at extracting exam questions from university question papers.

Analyze this PDF exam paper and extract ALL information in the following JSON structure:

{
  "examInfo": {
    "subjectCode": "string or null - e.g., BCA301",
    "subjectName": "string - e.g., Web Development",
    "examType": "MIDTERM_1 | MIDTERM_2 | END_TERM",
    "date": "YYYY-MM-DD format or null",
    "totalMarks": "number",
    "duration": "number in minutes",
    "semester": "number 1-8 or null",
    "academicYear": "string like 2024-2025 or null"
  },
  "instructions": ["array of exam instructions if present"],
  "sections": [
    {
      "name": "Section A / Part A / etc.",
      "questionType": "MCQ | SHORT | LONG | DESCRIPTIVE",
      "questions": [
        {
          "questionNumber": "1 or Q1 or 1a",
          "text": "Full question text",
          "marks": 2,
          "parts": [
            {"partLabel": "a", "text": "sub-question text", "marks": 1}
          ],
          "section": "A",
          "hasOptions": true,
          "options": ["a) option 1", "b) option 2"],
          "questionType": "MCQ | SHORT | LONG | DESCRIPTIVE",
          "difficulty": "EASY | MEDIUM | HARD"
        }
      ]
    }
  ],
  "allQuestions": [
    // Flat array of ALL questions for easy processing
  ]
}

IMPORTANT RULES:
1. Extract EVERY question, including sub-parts (a, b, c, etc.)
2. For questions with multiple parts, include them in the "parts" array
3. Capture exact marks for each question/part
4. Determine question type based on marks and nature:
   - 1-2 marks: Usually MCQ or SHORT
   - 3-5 marks: Usually SHORT or DESCRIPTIVE
   - 6+ marks: Usually LONG or DESCRIPTIVE
5. Include all MCQ options if present
6. Infer difficulty based on Bloom's taxonomy level of the question
7. The "allQuestions" array should have a flat list of all questions (including parts as separate entries if they're independent questions)

Return ONLY valid JSON, no markdown code blocks.`;

	try {
		const response = await client.models.generateContent({
			model: "gemini-2.5-flash",
			contents: [
				{
					inlineData: {
						mimeType: "application/pdf",
						data: base64Data,
					},
				},
				{
					text: prompt,
				},
			],
		});

		const text = response.text || "";

		// Clean up response - remove markdown code blocks if present
		let jsonText = text.trim();
		if (jsonText.startsWith("```json")) {
			jsonText = jsonText.slice(7);
		}
		if (jsonText.startsWith("```")) {
			jsonText = jsonText.slice(3);
		}
		if (jsonText.endsWith("```")) {
			jsonText = jsonText.slice(0, -3);
		}
		jsonText = jsonText.trim();

		const result: ExtractedPaper = JSON.parse(jsonText);

		console.log("✅ Extraction successful!\n");
		return result;
	} catch (error) {
		console.error("❌ Error extracting questions:", error);
		throw error;
	}
}

async function main() {
	const pdfPath = process.argv[2];

	if (!pdfPath) {
		console.log("Usage: npx ts-node src/scripts/extract-pyq.ts <path-to-pdf>");
		console.log(
			"Example: npx ts-node src/scripts/extract-pyq.ts './mid term 1 _ web dev.pdf'"
		);
		process.exit(1);
	}

	const absolutePath = path.resolve(pdfPath);

	if (!fs.existsSync(absolutePath)) {
		console.error(`❌ File not found: ${absolutePath}`);
		process.exit(1);
	}

	console.log("=".repeat(60));
	console.log("📚 PYQ (Previous Year Questions) Extractor");
	console.log("=".repeat(60));

	try {
		const result = await extractQuestionsFromPDF(absolutePath);

		// Display extracted information
		console.log("📋 EXAM INFORMATION:");
		console.log("-".repeat(40));
		console.log(`  Subject: ${result.examInfo.subjectName || "N/A"}`);
		console.log(`  Code: ${result.examInfo.subjectCode || "N/A"}`);
		console.log(`  Exam Type: ${result.examInfo.examType || "N/A"}`);
		console.log(`  Total Marks: ${result.examInfo.totalMarks || "N/A"}`);
		console.log(`  Duration: ${result.examInfo.duration || "N/A"} minutes`);
		console.log(`  Semester: ${result.examInfo.semester || "N/A"}`);
		console.log(`  Academic Year: ${result.examInfo.academicYear || "N/A"}`);

		console.log("\n📝 SECTIONS:");
		console.log("-".repeat(40));
		result.sections.forEach((section, idx) => {
			console.log(
				`\n  ${idx + 1}. ${section.name} (${section.questionType || "Mixed"})`
			);
			console.log(`     Questions: ${section.questions.length}`);

			section.questions.slice(0, 3).forEach((q) => {
				const preview =
					q.text.length > 60 ? q.text.substring(0, 60) + "..." : q.text;
				console.log(
					`     - Q${q.questionNumber}: ${preview} [${q.marks} marks]`
				);
			});

			if (section.questions.length > 3) {
				console.log(`     ... and ${section.questions.length - 3} more`);
			}
		});

		console.log("\n📊 SUMMARY:");
		console.log("-".repeat(40));
		console.log(`  Total Sections: ${result.sections.length}`);
		console.log(`  Total Questions: ${result.allQuestions.length}`);

		// Group by question type
		const byType = result.allQuestions.reduce((acc, q) => {
			acc[q.questionType] = (acc[q.questionType] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
		console.log(`  By Type:`, byType);

		// Save to JSON file for inspection
		const outputPath = absolutePath.replace(".pdf", "_extracted.json");
		fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
		console.log(`\n💾 Full extraction saved to: ${outputPath}`);

		console.log("\n" + "=".repeat(60));
		console.log("✅ Extraction complete!");
		console.log("=".repeat(60));
	} catch (error) {
		console.error("\n❌ Failed to extract questions:", error);
		process.exit(1);
	}
}

main();
