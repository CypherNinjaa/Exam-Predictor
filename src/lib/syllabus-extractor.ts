import { generateWithFallback, MODELS } from "./gemini";
import { prisma } from "./prisma";

// Types for extracted syllabus data
export interface ExtractedTopic {
	name: string;
	description?: string;
	subTopics?: string[];
}

export interface ExtractedModule {
	number: number;
	name: string;
	description?: string;
	hours?: number;
	topics: ExtractedTopic[];
}

export interface ExtractedBook {
	title: string;
	author?: string;
	publisher?: string;
	year?: number;
	edition?: string;
	type: "TEXTBOOK" | "REFERENCE";
}

export interface ExtractedEvaluation {
	midterm1?: number;
	midterm2?: number;
	endterm?: number;
	assignments?: number;
	practicals?: number;
	attendance?: number;
	other?: Record<string, number>;
}

export interface ExtractedSyllabus {
	subjectName?: string;
	subjectCode?: string;
	credits?: number;
	totalHours?: number;
	description?: string;
	modules: ExtractedModule[];
	books: ExtractedBook[];
	evaluation?: ExtractedEvaluation;
}

/**
 * Extract syllabus content from PDF using Gemini Vision
 */
export async function extractSyllabusFromPDF(
	pdfBuffer: Buffer
): Promise<ExtractedSyllabus> {
	try {
		// Convert PDF buffer to base64
		const base64PDF = pdfBuffer.toString("base64");

		const prompt = `You are an expert at extracting structured syllabus information from academic documents.

Analyze this PDF document and extract the syllabus information in the following JSON format.
Be thorough and extract ALL modules, topics, and subtopics mentioned.

IMPORTANT: Return ONLY valid JSON, no markdown code blocks or explanations.

Expected JSON structure:
{
  "subjectName": "string - full subject name",
  "subjectCode": "string - subject code if found",
  "credits": number,
  "totalHours": number,
  "description": "string - course description/objectives",
  "modules": [
    {
      "number": 1,
      "name": "Module Name",
      "description": "Module description if available",
      "hours": number,
      "topics": [
        {
          "name": "Topic Name",
          "description": "Topic description if available",
          "subTopics": ["Sub-topic 1", "Sub-topic 2"]
        }
      ]
    }
  ],
  "books": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "publisher": "Publisher",
      "year": 2024,
      "edition": "3rd",
      "type": "TEXTBOOK" or "REFERENCE"
    }
  ],
  "evaluation": {
    "midterm1": 15,
    "midterm2": 15,
    "endterm": 50,
    "assignments": 10,
    "practicals": 10,
    "attendance": 0,
    "other": {}
  }
}

Extract all information accurately. If a field is not found, omit it or use null.
For modules, maintain the order as they appear in the document.
For books, distinguish between textbooks and reference books.`;

		// Use generateWithFallback to try multiple models if one fails
		const result = await generateWithFallback(
			[
				{
					inlineData: {
						mimeType: "application/pdf",
						data: base64PDF,
					},
				},
				{ text: prompt },
			],
			MODELS.DOCUMENT
		);

		// New SDK returns text directly from response
		const text = result.text || "";

		// Parse the JSON response
		// Remove any markdown code blocks if present
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

		const extractedData: ExtractedSyllabus = JSON.parse(jsonText.trim());

		// Validate and ensure modules array exists
		if (!extractedData.modules) {
			extractedData.modules = [];
		}
		if (!extractedData.books) {
			extractedData.books = [];
		}

		return extractedData;
	} catch (error) {
		console.error("Error extracting syllabus:", error);
		throw new Error(
			`Failed to extract syllabus: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

/**
 * Save extracted syllabus to database
 */
export async function saveSyllabusToDatabase(
	subjectId: string,
	extractedData: ExtractedSyllabus,
	pdfUrl?: string
): Promise<string> {
	try {
		// Start a transaction to ensure data consistency
		const result = await prisma.$transaction(async (tx) => {
			// Check if syllabus already exists for this subject
			const existingSyllabus = await tx.syllabus.findUnique({
				where: { subjectId },
				include: {
					modules: true,
					books: true,
					evaluation: true,
				},
			});

			// If exists, delete old modules, books, and evaluation (cascade should handle topics/subtopics)
			if (existingSyllabus) {
				await tx.module.deleteMany({
					where: { syllabusId: existingSyllabus.id },
				});
				await tx.book.deleteMany({
					where: { syllabusId: existingSyllabus.id },
				});
				if (existingSyllabus.evaluation) {
					await tx.evaluationScheme.delete({
						where: { syllabusId: existingSyllabus.id },
					});
				}
			}

			// Upsert syllabus
			const syllabus = await tx.syllabus.upsert({
				where: { subjectId },
				update: {
					description: extractedData.description,
					totalHours: extractedData.totalHours,
					pdfUrl: pdfUrl,
					version: existingSyllabus
						? `${parseFloat(existingSyllabus.version || "1.0") + 0.1}`
						: "1.0",
					updatedAt: new Date(),
				},
				create: {
					subjectId,
					description: extractedData.description,
					totalHours: extractedData.totalHours,
					pdfUrl: pdfUrl,
					version: "1.0",
				},
			});

			// Create modules with topics and subtopics
			for (const moduleData of extractedData.modules) {
				const module = await tx.module.create({
					data: {
						syllabusId: syllabus.id,
						number: moduleData.number,
						name: moduleData.name,
						description: moduleData.description,
						hours: moduleData.hours,
					},
				});

				// Create topics for this module
				for (
					let topicIndex = 0;
					topicIndex < moduleData.topics.length;
					topicIndex++
				) {
					const topicData = moduleData.topics[topicIndex];

					const topic = await tx.topic.create({
						data: {
							moduleId: module.id,
							name: topicData.name,
							description: topicData.description,
							orderIndex: topicIndex,
						},
					});

					// Create subtopics
					if (topicData.subTopics && topicData.subTopics.length > 0) {
						await tx.subTopic.createMany({
							data: topicData.subTopics.map((subTopicName) => ({
								topicId: topic.id,
								name: subTopicName,
							})),
						});
					}
				}
			}

			// Create books
			if (extractedData.books && extractedData.books.length > 0) {
				await tx.book.createMany({
					data: extractedData.books.map((book) => ({
						syllabusId: syllabus.id,
						title: book.title,
						author: book.author,
						publisher: book.publisher,
						year: book.year,
						edition: book.edition,
						bookType: book.type === "TEXTBOOK" ? "TEXTBOOK" : "REFERENCE",
					})),
				});
			}

			// Create evaluation scheme
			if (extractedData.evaluation) {
				await tx.evaluationScheme.create({
					data: {
						syllabusId: syllabus.id,
						midterm1: extractedData.evaluation.midterm1,
						midterm2: extractedData.evaluation.midterm2,
						endterm: extractedData.evaluation.endterm,
						assignments: extractedData.evaluation.assignments,
						practicals: extractedData.evaluation.practicals,
						attendance: extractedData.evaluation.attendance,
						otherComponents: extractedData.evaluation.other,
					},
				});
			}

			return syllabus.id;
		});

		return result;
	} catch (error) {
		console.error("Error saving syllabus to database:", error);
		throw new Error(
			`Failed to save syllabus: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

/**
 * Get syllabus data for AI to read (for predictions)
 */
export async function getSyllabusForAI(subjectId: string) {
	const syllabus = await prisma.syllabus.findUnique({
		where: { subjectId },
		include: {
			subject: {
				select: {
					name: true,
					code: true,
					credits: true,
				},
			},
			modules: {
				orderBy: { number: "asc" },
				include: {
					topics: {
						orderBy: { orderIndex: "asc" },
						include: {
							subTopics: true,
						},
					},
				},
			},
			books: true,
			evaluation: true,
		},
	});

	if (!syllabus) {
		return null;
	}

	// Format for AI consumption
	return {
		subject: {
			name: syllabus.subject.name,
			code: syllabus.subject.code,
			credits: syllabus.subject.credits,
		},
		description: syllabus.description,
		totalHours: syllabus.totalHours,
		modules: syllabus.modules.map((module) => ({
			number: module.number,
			name: module.name,
			description: module.description,
			hours: module.hours,
			topics: module.topics.map((topic) => ({
				name: topic.name,
				description: topic.description,
				subTopics: topic.subTopics.map((st) => st.name),
				// Include frequency data for predictions
				timesAsked: topic.timesAsked,
				lastAskedDate: topic.lastAskedDate,
				freshnessScore: topic.freshnessScore,
			})),
		})),
		books: syllabus.books.map((book) => ({
			title: book.title,
			author: book.author,
			type: book.bookType,
		})),
		evaluation: syllabus.evaluation
			? {
					midterm1: syllabus.evaluation.midterm1,
					midterm2: syllabus.evaluation.midterm2,
					endterm: syllabus.evaluation.endterm,
					assignments: syllabus.evaluation.assignments,
					practicals: syllabus.evaluation.practicals,
			  }
			: null,
	};
}

/**
 * Get complete syllabus JSON for display/export
 */
export async function getSyllabusJSON(syllabusId: string) {
	const syllabus = await prisma.syllabus.findUnique({
		where: { id: syllabusId },
		include: {
			subject: {
				include: {
					semester: {
						include: {
							batch: {
								include: {
									course: true,
								},
							},
						},
					},
				},
			},
			modules: {
				orderBy: { number: "asc" },
				include: {
					topics: {
						orderBy: { orderIndex: "asc" },
						include: {
							subTopics: true,
						},
					},
				},
			},
			books: true,
			evaluation: true,
		},
	});

	return syllabus;
}
