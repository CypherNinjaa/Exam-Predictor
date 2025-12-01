/**
 * PYQ (Previous Year Questions) Extractor
 * Uses Gemini AI to extract questions from exam paper PDFs
 */

import { gemini, MODELS } from "./gemini";
import { prisma } from "./prisma";
import { ExamType, QuestionType, Difficulty } from "@prisma/client";
import crypto from "crypto";

// ============ TYPES ============

export interface ExtractedQuestion {
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
	isAlternative?: boolean; // Is this an "OR" question?
	alternativeOf?: string; // Question number this is alternative to
}

export interface ExtractedPaper {
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

export interface PYQUploadResult {
	success: boolean;
	examId?: string;
	questionsCount?: number;
	extractedData?: ExtractedPaper;
	error?: string;
	isDuplicate?: boolean;
}

// ============ EXTRACTION ============

/**
 * Extract questions from a PYQ PDF using Gemini AI
 */
export async function extractQuestionsFromPDF(
	pdfBuffer: Buffer
): Promise<ExtractedPaper> {
	const base64Data = pdfBuffer.toString("base64");

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
      "questions": [...]
    }
  ],
  "allQuestions": [
    {
      "questionNumber": "1 or Q1 or 1a",
      "text": "Full question text",
      "marks": 2,
      "section": "A",
      "hasOptions": false,
      "options": [],
      "questionType": "MCQ | SHORT | LONG | DESCRIPTIVE",
      "difficulty": "EASY | MEDIUM | HARD",
      "isAlternative": false,
      "alternativeOf": null
    }
  ]
}

IMPORTANT RULES:
1. Extract EVERY question including sub-parts (expand 1a, 1b as separate questions)
2. For OR questions, set isAlternative=true and alternativeOf to the question number it's an alternative to
3. Capture exact marks for each question
4. Determine question type: MCQ (options), SHORT (1-3 marks), LONG (5+ marks), DESCRIPTIVE (explanation/code)
5. Include MCQ options if present
6. Infer difficulty: EASY (recall), MEDIUM (understanding), HARD (apply/analyze)
7. The allQuestions array should be FLAT - expand all sub-questions

Return ONLY valid JSON, no markdown code blocks.`;

	const response = await gemini.models.generateContent({
		model: MODELS.DOCUMENT,
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

	return JSON.parse(jsonText) as ExtractedPaper;
}

// ============ DUPLICATE DETECTION ============

/**
 * Generate MD5 hash for duplicate detection
 */
export function generateFileHash(buffer: Buffer): string {
	return crypto.createHash("md5").update(buffer).digest("hex");
}

/**
 * Check if a PYQ paper already exists
 */
export async function checkPYQDuplicate(
	subjectId: string,
	examType: ExamType,
	semesterId: string,
	academicYear: string,
	fileHash: string
): Promise<{ isDuplicate: boolean; existingExam?: { id: string } }> {
	// Check by file hash first (exact same file)
	const byHash = await prisma.exam.findFirst({
		where: { fileHash },
		select: { id: true },
	});

	if (byHash) {
		return { isDuplicate: true, existingExam: byHash };
	}

	// Check by subject + examType + semester + academicYear
	const byMetadata = await prisma.exam.findFirst({
		where: {
			subjectId,
			examType,
			semesterId,
			academicYear,
		},
		select: { id: true },
	});

	if (byMetadata) {
		return { isDuplicate: true, existingExam: byMetadata };
	}

	return { isDuplicate: false };
}

// ============ DATABASE SAVE ============

/**
 * Map extracted question type to Prisma enum
 */
function mapQuestionType(type: string): QuestionType {
	const typeMap: Record<string, QuestionType> = {
		MCQ: "MCQ",
		SHORT: "SHORT",
		LONG: "LONG",
		DESCRIPTIVE: "LONG", // Map DESCRIPTIVE to LONG
	};
	return typeMap[type] || "SHORT";
}

/**
 * Map extracted difficulty to Prisma enum
 */
function mapDifficulty(diff?: string): Difficulty {
	const diffMap: Record<string, Difficulty> = {
		EASY: "EASY",
		MEDIUM: "MEDIUM",
		HARD: "HARD",
	};
	return diff ? diffMap[diff] || "MEDIUM" : "MEDIUM";
}

/**
 * Map extracted exam type to Prisma enum
 */
function mapExamType(type?: string): ExamType {
	const typeMap: Record<string, ExamType> = {
		MIDTERM_1: "MIDTERM_1",
		MIDTERM_2: "MIDTERM_2",
		END_TERM: "END_TERM",
		MID1: "MIDTERM_1",
		MID2: "MIDTERM_2",
		ENDTERM: "END_TERM",
		FINAL: "END_TERM",
	};
	return type ? typeMap[type.toUpperCase()] || "MIDTERM_1" : "MIDTERM_1";
}

/**
 * Save extracted PYQ to database
 */
export async function savePYQToDatabase(
	extractedData: ExtractedPaper,
	subjectId: string,
	semesterId: string,
	academicYear: string,
	examType: ExamType,
	fileHash?: string,
	forceReplace: boolean = false
): Promise<{ examId: string; questionsCount: number }> {
	// Check for duplicates
	const duplicate = await checkPYQDuplicate(
		subjectId,
		examType,
		semesterId,
		academicYear,
		fileHash || ""
	);

	if (duplicate.isDuplicate && !forceReplace) {
		throw new Error("DUPLICATE_PYQ");
	}

	// If replacing, delete existing exam and its questions
	if (duplicate.isDuplicate && forceReplace && duplicate.existingExam) {
		await prisma.exam.delete({
			where: { id: duplicate.existingExam.id },
		});
	}

	// Use transaction with extended timeout
	const result = await prisma.$transaction(
		async (tx) => {
			// 1. Create the exam
			const exam = await tx.exam.create({
				data: {
					examType,
					subjectId,
					semesterId,
					academicYear,
					examDate: extractedData.examInfo.date
						? new Date(extractedData.examInfo.date)
						: null,
					totalMarks: extractedData.examInfo.totalMarks || 60,
					duration: extractedData.examInfo.duration || 180,
					fileHash,
					isProcessed: true,
				},
			});

			// 2. Prepare questions for batch insert
			const questionsData: {
				questionNumber: string;
				text: string;
				marks: number;
				examId: string;
				section: string | null;
				questionType: QuestionType;
				difficulty: Difficulty;
				options: string[];
				hasAlternative: boolean;
				alternativeToId: string | null;
			}[] = [];

			// Map to track question numbers to IDs for OR questions
			const questionMap = new Map<string, string>();

			// First pass: create non-alternative questions
			for (const q of extractedData.allQuestions) {
				if (!q.isAlternative) {
					questionsData.push({
						questionNumber: q.questionNumber,
						text: q.text,
						marks: q.marks,
						examId: exam.id,
						section: q.section || null,
						questionType: mapQuestionType(q.questionType),
						difficulty: mapDifficulty(q.difficulty),
						options: q.options || [],
						hasAlternative: false,
						alternativeToId: null,
					});
				}
			}

			// Batch create non-alternative questions
			if (questionsData.length > 0) {
				await tx.question.createMany({
					data: questionsData,
				});

				// Fetch created questions to build the map
				const createdQuestions = await tx.question.findMany({
					where: { examId: exam.id },
					select: { id: true, questionNumber: true },
				});

				for (const q of createdQuestions) {
					questionMap.set(q.questionNumber, q.id);
				}
			}

			// Second pass: create alternative questions
			const alternativeQuestionsData: typeof questionsData = [];

			for (const q of extractedData.allQuestions) {
				if (q.isAlternative && q.alternativeOf) {
					// Find the original question ID
					const originalId = questionMap.get(q.alternativeOf);

					// Clean up question number (remove "OR" suffix)
					const cleanNumber = q.questionNumber.replace(/\s*OR\s*/i, "");

					alternativeQuestionsData.push({
						questionNumber: cleanNumber + " (OR)",
						text: q.text,
						marks: q.marks,
						examId: exam.id,
						section: q.section || null,
						questionType: mapQuestionType(q.questionType),
						difficulty: mapDifficulty(q.difficulty),
						options: q.options || [],
						hasAlternative: true,
						alternativeToId: originalId || null,
					});
				}
			}

			// Batch create alternative questions
			if (alternativeQuestionsData.length > 0) {
				await tx.question.createMany({
					data: alternativeQuestionsData,
				});

				// Update original questions to mark they have alternatives
				const originalIds = alternativeQuestionsData
					.map((q) => q.alternativeToId)
					.filter(Boolean) as string[];

				if (originalIds.length > 0) {
					await tx.question.updateMany({
						where: { id: { in: originalIds } },
						data: { hasAlternative: true },
					});
				}
			}

			const totalQuestions =
				questionsData.length + alternativeQuestionsData.length;

			return { examId: exam.id, questionsCount: totalQuestions };
		},
		{
			maxWait: 30000, // 30 seconds
			timeout: 60000, // 60 seconds
		}
	);

	return result;
}

// ============ MAIN UPLOAD FUNCTION ============

/**
 * Main function to handle PYQ upload and extraction
 */
export async function uploadAndExtractPYQ(
	pdfBuffer: Buffer,
	subjectId: string,
	semesterId: string,
	academicYear: string,
	examType: ExamType,
	forceReplace: boolean = false
): Promise<PYQUploadResult> {
	try {
		// 1. Generate file hash
		const fileHash = generateFileHash(pdfBuffer);

		// 2. Check for duplicates first
		const duplicate = await checkPYQDuplicate(
			subjectId,
			examType,
			semesterId,
			academicYear,
			fileHash
		);

		if (duplicate.isDuplicate && !forceReplace) {
			return {
				success: false,
				isDuplicate: true,
				error: "This PYQ paper already exists in the database",
			};
		}

		// 3. Extract questions using AI
		console.log("Extracting questions from PDF...");
		const extractedData = await extractQuestionsFromPDF(pdfBuffer);
		console.log(
			`Extracted ${extractedData.allQuestions.length} questions from PDF`
		);

		// 4. Save to database
		const result = await savePYQToDatabase(
			extractedData,
			subjectId,
			semesterId,
			academicYear,
			examType,
			fileHash,
			forceReplace
		);

		return {
			success: true,
			examId: result.examId,
			questionsCount: result.questionsCount,
			extractedData,
		};
	} catch (error) {
		console.error("Error in uploadAndExtractPYQ:", error);

		if (error instanceof Error && error.message === "DUPLICATE_PYQ") {
			return {
				success: false,
				isDuplicate: true,
				error: "This PYQ paper already exists in the database",
			};
		}

		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to process PYQ paper",
		};
	}
}
