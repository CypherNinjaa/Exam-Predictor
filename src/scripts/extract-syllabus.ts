/**
 * Syllabus Extraction Script using Gemini
 * Extracts and structures syllabus content from PDF
 *
 * Usage: npm run extract:syllabus <path-to-pdf>
 */

import * as fs from "fs";
import * as path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from "pdf-parse";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// Use gemini-2.0-flash or gemini-1.5-flash-latest
const geminiPro = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const SYLLABUS_EXTRACTION_PROMPT = `
You are an expert at analyzing university syllabus documents.
Analyze the following syllabus content and extract a structured format.

Extract the following information:
1. Subject/Course Details:
   - Subject Code
   - Subject Name
   - Credits
   - Semester (if mentioned)

2. For EACH Module/Unit, extract:
   - Module Number
   - Module Name/Title
   - Topics covered (list each topic)
   - Subtopics (if any)
   - Estimated hours/weightage (if mentioned)

3. Books/References (if mentioned):
   - Textbooks
   - Reference books

4. Evaluation Scheme (if mentioned):
   - Exam types and weightage

Return as a well-structured JSON:
{
  "subject": {
    "code": "string or null",
    "name": "string",
    "credits": "number or null",
    "semester": "number or null"
  },
  "modules": [
    {
      "number": 1,
      "name": "Module Name",
      "topics": [
        {
          "name": "Topic Name",
          "subtopics": ["Subtopic 1", "Subtopic 2"]
        }
      ],
      "hours": "number or null",
      "weightage": "percentage or null"
    }
  ],
  "books": {
    "textbooks": ["Book 1", "Book 2"],
    "references": ["Ref 1", "Ref 2"]
  },
  "evaluation": {
    "midterm1": "percentage or null",
    "midterm2": "percentage or null",
    "endterm": "percentage or null",
    "other": []
  }
}

IMPORTANT:
- Extract ALL modules and topics mentioned
- Preserve the exact names and terminology used
- If information is not available, use null
- Be thorough - don't miss any topics

SYLLABUS CONTENT:
`;

interface SyllabusStructure {
	subject: {
		code: string | null;
		name: string;
		credits: number | null;
		semester: number | null;
	};
	modules: Array<{
		number: number;
		name: string;
		topics: Array<{
			name: string;
			subtopics: string[];
		}>;
		hours: number | null;
		weightage: string | null;
	}>;
	books: {
		textbooks: string[];
		references: string[];
	};
	evaluation: {
		midterm1: string | null;
		midterm2: string | null;
		endterm: string | null;
		other: string[];
	};
}

async function extractTextFromPDF(pdfPath: string): Promise<string> {
	console.log(`📄 Reading PDF: ${path.basename(pdfPath)}`);

	const dataBuffer = fs.readFileSync(pdfPath);
	const pdfData = await pdfParse(dataBuffer);

	console.log(`📊 Pages: ${pdfData.numpages}`);
	console.log(`📝 Characters: ${pdfData.text.length}`);

	return pdfData.text;
}

async function extractSyllabusStructure(
	text: string
): Promise<SyllabusStructure> {
	console.log("\n🤖 Analyzing with Gemini AI...\n");

	const result = await geminiPro.generateContent([
		SYLLABUS_EXTRACTION_PROMPT + text,
	]);

	const response = result.response.text();

	// Parse JSON from response
	const jsonMatch = response.match(/\{[\s\S]*\}/);
	if (jsonMatch) {
		try {
			return JSON.parse(jsonMatch[0]) as SyllabusStructure;
		} catch (parseError) {
			console.error("❌ JSON Parse Error");
			console.log("Raw response:", response);
			throw new Error("Failed to parse syllabus structure");
		}
	}

	throw new Error("No valid JSON found in response");
}

function displaySyllabusStructure(syllabus: SyllabusStructure): void {
	console.log("\n" + "=".repeat(60));
	console.log("📚 SYLLABUS STRUCTURE");
	console.log("=".repeat(60));

	// Subject Info
	console.log("\n📖 SUBJECT DETAILS:");
	console.log(`   Name: ${syllabus.subject.name}`);
	if (syllabus.subject.code) console.log(`   Code: ${syllabus.subject.code}`);
	if (syllabus.subject.credits)
		console.log(`   Credits: ${syllabus.subject.credits}`);
	if (syllabus.subject.semester)
		console.log(`   Semester: ${syllabus.subject.semester}`);

	// Modules
	console.log("\n📋 MODULES & TOPICS:");
	console.log("-".repeat(60));

	syllabus.modules.forEach((mod) => {
		console.log(`\n🔹 MODULE ${mod.number}: ${mod.name}`);
		if (mod.hours) console.log(`   Hours: ${mod.hours}`);
		if (mod.weightage) console.log(`   Weightage: ${mod.weightage}`);

		mod.topics.forEach((topic, i) => {
			console.log(`   ${i + 1}. ${topic.name}`);
			if (topic.subtopics && topic.subtopics.length > 0) {
				topic.subtopics.forEach((sub) => {
					console.log(`      • ${sub}`);
				});
			}
		});
	});

	// Books
	if (
		syllabus.books.textbooks.length > 0 ||
		syllabus.books.references.length > 0
	) {
		console.log("\n📚 BOOKS & REFERENCES:");
		console.log("-".repeat(60));

		if (syllabus.books.textbooks.length > 0) {
			console.log("   Textbooks:");
			syllabus.books.textbooks.forEach((book) => {
				console.log(`   • ${book}`);
			});
		}

		if (syllabus.books.references.length > 0) {
			console.log("   References:");
			syllabus.books.references.forEach((book) => {
				console.log(`   • ${book}`);
			});
		}
	}

	// Evaluation
	if (
		syllabus.evaluation.midterm1 ||
		syllabus.evaluation.midterm2 ||
		syllabus.evaluation.endterm
	) {
		console.log("\n📊 EVALUATION SCHEME:");
		console.log("-".repeat(60));
		if (syllabus.evaluation.midterm1)
			console.log(`   Midterm 1: ${syllabus.evaluation.midterm1}`);
		if (syllabus.evaluation.midterm2)
			console.log(`   Midterm 2: ${syllabus.evaluation.midterm2}`);
		if (syllabus.evaluation.endterm)
			console.log(`   End Term: ${syllabus.evaluation.endterm}`);
	}

	// Summary
	console.log("\n" + "=".repeat(60));
	console.log("📈 SUMMARY:");
	console.log(`   Total Modules: ${syllabus.modules.length}`);
	const totalTopics = syllabus.modules.reduce(
		(acc, mod) => acc + mod.topics.length,
		0
	);
	console.log(`   Total Topics: ${totalTopics}`);
	console.log("=".repeat(60));
}

async function main() {
	console.log("\n🚀 Syllabus Extractor (Gemini AI)\n");
	console.log("=".repeat(60));

	const pdfPath = process.argv[2] || "./web-dev tech.pdf";

	if (!fs.existsSync(pdfPath)) {
		console.error(`❌ File not found: ${pdfPath}`);
		console.log("\nUsage: npm run extract:syllabus <path-to-pdf>");
		process.exit(1);
	}

	try {
		// Step 1: Extract text from PDF
		const pdfText = await extractTextFromPDF(pdfPath);

		// Step 2: Analyze with Gemini
		const syllabus = await extractSyllabusStructure(pdfText);

		// Step 3: Display structured output
		displaySyllabusStructure(syllabus);

		// Step 4: Save to JSON
		const outputPath = pdfPath.replace(/\.pdf$/i, "-syllabus.json");
		fs.writeFileSync(outputPath, JSON.stringify(syllabus, null, 2));
		console.log(`\n💾 Saved to: ${outputPath}`);

		console.log("\n✅ Extraction complete!");

		return syllabus;
	} catch (error) {
		console.error("\n❌ Error:", error);
		process.exit(1);
	}
}

main();
