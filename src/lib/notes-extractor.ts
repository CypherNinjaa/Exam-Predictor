/**
 * Notes Extractor Library
 * Extracts text and analyzes content from various file formats
 * Supports: PDF, DOCX, PPTX, Images (JPG, PNG, etc.)
 */

import { gemini, MODELS } from "./gemini";
import { prisma } from "./prisma";
import fs from "fs";
import path from "path";

// ============ TYPES ============

export interface NoteExtractionResult {
	success: boolean;
	extractedText: string;
	keyTopics: string[];
	moduleNumbers: number[];
	error?: string;
}

// ============ FILE PROCESSING ============

/**
 * Extract text from any file format using Gemini AI
 * For images/PDFs: Uses Gemini's vision capabilities
 * For text-based files: Reads directly and analyzes with Gemini
 */
export async function extractNoteContent(
	filePath: string,
	subjectId: string,
	fileType: string
): Promise<NoteExtractionResult> {
	try {
		// Get subject and syllabus info for context
		const subject = await prisma.subject.findUnique({
			where: { id: subjectId },
			include: {
				syllabus: {
					include: {
						modules: {
							include: {
								topics: true,
							},
							orderBy: { number: "asc" },
						},
					},
				},
			},
		});

		if (!subject) {
			return {
				success: false,
				extractedText: "",
				keyTopics: [],
				moduleNumbers: [],
				error: "Subject not found",
			};
		}

		// Read file as buffer for AI processing
		const fileBuffer = fs.readFileSync(filePath);
		const base64Data = fileBuffer.toString("base64");

		// Determine MIME type
		const mimeType = getMimeType(fileType);

		// Build context about the subject and modules
		const syllabusContext = subject.syllabus
			? `
## SUBJECT INFORMATION
- Subject: ${subject.name}
- Code: ${subject.code}

## SYLLABUS MODULES
${subject.syllabus.modules
	.map(
		(m) => `
Module ${m.number}: ${m.name}
Topics: ${m.topics.map((t) => t.name).join(", ")}
`
	)
	.join("\n")}
`
			: `Subject: ${subject.name} (${subject.code})`;

		// Create prompt for AI analysis
		const prompt = `You are analyzing educational notes/study material. Extract the content and identify key topics.

${syllabusContext}

**Your Task:**
1. Extract ALL text content from this document (limit to 3000 characters for extractedText)
2. Identify the main topics covered (be specific, 5-15 topics)
3. Match topics to the syllabus modules listed above
4. Return ONLY a valid JSON object, no extra text before or after

**Required JSON Format:**
{
  "extractedText": "Full content summary...",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "moduleNumbers": [1, 2, 3]
}

**Rules:**
- Return ONLY the JSON object, nothing else
- Keep extractedText under 3000 characters
- Use double quotes for all strings
- Ensure valid JSON syntax
- If no modules match, use empty array: []
- Do not include markdown code blocks

Analyze the document and return the JSON:`;

		// Use Gemini with vision/document capabilities
		const response = await gemini.models.generateContent({
			model: MODELS.DOCUMENT, // gemini-2.5-flash for document processing
			contents: [
				{
					text: prompt,
				},
				{
					inlineData: {
						mimeType: mimeType,
						data: base64Data,
					},
				},
			],
		});

		// Get text from response
		const text = response.text || "";
		if (!text) {
			throw new Error("No response from AI");
		}

		// Extract JSON from response (handle markdown code blocks and extra text)
		let jsonText = text.trim();

		// Remove markdown code blocks
		if (jsonText.includes("```json")) {
			const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
			if (match) {
				jsonText = match[1].trim();
			}
		} else if (jsonText.includes("```")) {
			const match = jsonText.match(/```\s*([\s\S]*?)\s*```/);
			if (match) {
				jsonText = match[1].trim();
			}
		}

		// Try to find JSON object if there's extra text
		if (!jsonText.startsWith("{")) {
			const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				jsonText = jsonMatch[0];
			}
		}

		// Parse JSON with error handling
		let result;
		try {
			result = JSON.parse(jsonText);
		} catch (parseError) {
			console.error("JSON Parse Error:", parseError);
			console.error("Attempted to parse:", jsonText.substring(0, 500));

			// Fallback: Try to extract basic info manually
			return {
				success: true,
				extractedText: text.substring(0, 5000), // Use raw text as fallback
				keyTopics: [],
				moduleNumbers: [],
			};
		}

		// Remove duplicates from arrays and sort module numbers
		const topics = Array.isArray(result.keyTopics) ? result.keyTopics : [];
		const modules = Array.isArray(result.moduleNumbers)
			? result.moduleNumbers
			: [];

		const uniqueTopics = [...new Set(topics)].filter(
			(t): t is string => typeof t === "string"
		);
		const uniqueModules = [...new Set(modules)]
			.filter((m): m is number => typeof m === "number")
			.sort((a, b) => a - b);

		return {
			success: true,
			extractedText: result.extractedText || "",
			keyTopics: uniqueTopics,
			moduleNumbers: uniqueModules,
		};
	} catch (error) {
		console.error("Note extraction error:", error);
		return {
			success: false,
			extractedText: "",
			keyTopics: [],
			moduleNumbers: [],
			error: error instanceof Error ? error.message : "Extraction failed",
		};
	}
}

/**
 * Get MIME type for file extension
 */
function getMimeType(fileType: string): string {
	const ext = fileType.toLowerCase().replace(".", "");

	const mimeTypes: Record<string, string> = {
		// Documents
		pdf: "application/pdf",
		doc: "application/msword",
		docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		ppt: "application/vnd.ms-powerpoint",
		pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		txt: "text/plain",

		// Images
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		png: "image/png",
		gif: "image/gif",
		webp: "image/webp",
		bmp: "image/bmp",
	};

	return mimeTypes[ext] || "application/octet-stream";
}

/**
 * Save uploaded file to public/uploads/notes/
 * Returns the relative URL path
 */
export async function saveNoteFile(
	file: File,
	subjectCode: string
): Promise<{ success: boolean; filePath: string; error?: string }> {
	try {
		// Create uploads directory if it doesn't exist
		const uploadDir = path.join(process.cwd(), "public", "uploads", "notes");
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		// Generate unique filename: subjectCode_timestamp_originalname
		const timestamp = Date.now();
		const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
		const fileName = `${subjectCode}_${timestamp}_${sanitizedFileName}`;
		const filePath = path.join(uploadDir, fileName);

		// Convert file to buffer and save
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		fs.writeFileSync(filePath, buffer);

		// Return relative URL path
		const relativeUrl = `/uploads/notes/${fileName}`;

		return {
			success: true,
			filePath: relativeUrl,
		};
	} catch (error) {
		console.error("File save error:", error);
		return {
			success: false,
			filePath: "",
			error: error instanceof Error ? error.message : "Failed to save file",
		};
	}
}

/**
 * Delete note file from filesystem
 */
export function deleteNoteFile(fileUrl: string): boolean {
	try {
		const filePath = path.join(process.cwd(), "public", fileUrl);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
			return true;
		}
		return false;
	} catch (error) {
		console.error("File delete error:", error);
		return false;
	}
}
