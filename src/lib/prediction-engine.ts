/**
 * Advanced Prediction Engine
 * Uses syllabus, PYQs, web search, and Gemini's thinking capabilities
 */

import {
	gemini,
	MODELS,
	generateWithThinking,
	getPredictionModel,
} from "./gemini";
import { prisma } from "./prisma";
import { ExamType, QuestionType, Difficulty } from "@prisma/client";

// ============ TYPES ============

export interface ModuleScope {
	moduleNumber: number;
	moduleName: string;
	included: boolean;
	excludedTopics?: string[]; // Topics to skip (e.g., "Bootstrap")
	topics: {
		name: string;
		included: boolean;
	}[];
}

export interface PredictionConfig {
	subjectId: string;
	examType: ExamType;
	syllabusScope: ModuleScope[];
	questionCount?: number;
	useWebSearch?: boolean;
	useThinkingModel?: boolean;
	useGemini3?: boolean; // NEW: Optional flag to use Gemini 3.0 Preview
	model?: string; // NEW: Model to use (gemini-2.5-pro, gemini-3-pro-preview, etc.)
}

export interface PredictedQuestion {
	id: string;
	text: string;
	probability: number;
	module: string;
	topic: string;
	difficulty: Difficulty;
	questionType: QuestionType;
	marks: number;
	reasoning: string[];
	source:
		| "pattern_analysis"
		| "topic_freshness"
		| "web_trends"
		| "ai_reasoning";
	similarPYQs?: string[];
}

export interface PredictionResult {
	success: boolean;
	predictions: PredictedQuestion[];
	metadata: {
		subjectName: string;
		subjectCode: string;
		examType: ExamType;
		totalPYQsAnalyzed: number;
		questionsByExamType?: {
			MIDTERM_1: number;
			MIDTERM_2: number;
			END_TERM: number;
		};
		modulesIncluded: string[];
		generatedAt: Date;
		modelUsed: string;
		confidence: number;
	};
	error?: string;
}

// ============ HELPER FUNCTIONS ============

/**
 * Get syllabus with modules and topics for a subject
 */
async function getSyllabusData(subjectId: string) {
	return await prisma.syllabus.findUnique({
		where: { subjectId },
		include: {
			modules: {
				include: {
					topics: {
						include: {
							subTopics: true,
						},
					},
				},
				orderBy: { number: "asc" },
			},
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
		},
	});
}

/**
 * Get ALL historical questions (PYQs) for the subject - ALL EXAM TYPES
 * This analyzes the complete question bank to understand patterns
 */
async function getAllPYQData(subjectId: string) {
	return await prisma.question.findMany({
		where: {
			exam: {
				subjectId,
			},
		},
		include: {
			module: true,
			topic: true,
			exam: {
				select: {
					examType: true,
					academicYear: true,
					totalMarks: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});
}

/**
 * Build filtered syllabus content based on scope
 */
function buildFilteredSyllabus(
	modules: Array<{
		number: number;
		name: string;
		topics: Array<{ name: string; description: string | null }>;
	}>,
	scope: ModuleScope[]
) {
	const filtered: Array<{
		module: number;
		name: string;
		topics: string[];
	}> = [];

	for (const module of modules) {
		const scopeEntry = scope.find((s) => s.moduleNumber === module.number);

		if (!scopeEntry || !scopeEntry.included) {
			continue; // Skip this module
		}

		const includedTopics = module.topics
			.filter((topic) => {
				// Check if topic is explicitly excluded
				if (
					scopeEntry.excludedTopics?.some((excluded) =>
						topic.name.toLowerCase().includes(excluded.toLowerCase())
					)
				) {
					return false;
				}

				// Check if topic is in the included list
				const topicScope = scopeEntry.topics.find(
					(t) => t.name.toLowerCase() === topic.name.toLowerCase()
				);
				return topicScope ? topicScope.included : true;
			})
			.map((t) => t.name);

		if (includedTopics.length > 0) {
			filtered.push({
				module: module.number,
				name: module.name,
				topics: includedTopics,
			});
		}
	}

	return filtered;
}

/**
 * Comprehensive PYQ Analysis - Analyzes ALL questions across ALL exam types
 * This is the core analysis that powers our predictions
 */
function analyzeAllPYQPatterns(
	questions: Array<{
		text: string;
		marks: number;
		questionType: QuestionType;
		difficulty: Difficulty;
		module: { name: string; number: number } | null;
		topic: { name: string } | null;
		exam: { examType: ExamType; academicYear: string | null };
	}>,
	targetExamType: ExamType
) {
	// Analyze ALL questions first
	const moduleFrequency: Record<string, number> = {};
	const topicFrequency: Record<string, number> = {};
	const topicByExamType: Record<string, Record<ExamType, number>> = {};
	const marksDistribution: Record<number, number> = {};
	const questionTypes: Record<string, number> = {};
	const topicLastAsked: Record<string, { year: string; examType: ExamType }> =
		{};
	const repeatedTopics: Record<string, number> = {}; // Topics that appear frequently

	// Separate questions by exam type for pattern analysis
	const questionsByExamType: Record<ExamType, typeof questions> = {
		MIDTERM_1: [],
		MIDTERM_2: [],
		END_TERM: [],
	};

	for (const q of questions) {
		questionsByExamType[q.exam.examType].push(q);

		// Count module frequency
		if (q.module) {
			moduleFrequency[q.module.name] =
				(moduleFrequency[q.module.name] || 0) + 1;
		}

		// Count topic frequency and track by exam type
		if (q.topic) {
			const topicName = q.topic.name;
			topicFrequency[topicName] = (topicFrequency[topicName] || 0) + 1;

			// Track frequency by exam type
			if (!topicByExamType[topicName]) {
				topicByExamType[topicName] = {
					MIDTERM_1: 0,
					MIDTERM_2: 0,
					END_TERM: 0,
				};
			}
			topicByExamType[topicName][q.exam.examType]++;

			// Track when topic was last asked
			if (q.exam.academicYear) {
				const existing = topicLastAsked[topicName];
				if (!existing || q.exam.academicYear > existing.year) {
					topicLastAsked[topicName] = {
						year: q.exam.academicYear,
						examType: q.exam.examType,
					};
				}
			}

			// Count repetitions (topics asked 2+ times are important)
			if (topicFrequency[topicName] >= 2) {
				repeatedTopics[topicName] = topicFrequency[topicName];
			}
		}

		marksDistribution[q.marks] = (marksDistribution[q.marks] || 0) + 1;
		questionTypes[q.questionType] = (questionTypes[q.questionType] || 0) + 1;
	}

	// Questions from target exam type for style reference
	const targetExamQuestions = questionsByExamType[targetExamType];
	const sampleQuestions = targetExamQuestions.slice(0, 15).map((q) => ({
		text: q.text,
		marks: q.marks,
		module: q.module?.name,
		topic: q.topic?.name,
		type: q.questionType,
		year: q.exam.academicYear,
	}));

	// Questions from OTHER exam types (to understand what's NOT in target exam)
	const otherExamQuestions = questions
		.filter((q) => q.exam.examType !== targetExamType)
		.slice(0, 10)
		.map((q) => ({
			text: q.text,
			marks: q.marks,
			module: q.module?.name,
			topic: q.topic?.name,
			type: q.questionType,
			examType: q.exam.examType,
			year: q.exam.academicYear,
		}));

	// Calculate topic importance scores
	const topicImportance: Record<string, { score: number; reasons: string[] }> =
		{};
	for (const [topic, freq] of Object.entries(topicFrequency)) {
		const reasons: string[] = [];
		let score = freq * 10; // Base score from frequency

		// Boost if frequently asked in target exam type
		const targetFreq = topicByExamType[topic]?.[targetExamType] || 0;
		if (targetFreq >= 2) {
			score += 20;
			reasons.push(
				`Asked ${targetFreq} times in ${targetExamType.replace("_", " ")}`
			);
		}

		// Boost if asked across multiple exam types (important topic)
		const examTypesAsked = Object.values(topicByExamType[topic] || {}).filter(
			(v) => v > 0
		).length;
		if (examTypesAsked >= 2) {
			score += 15;
			reasons.push(`Asked in ${examTypesAsked} different exam types`);
		}

		// Freshness penalty - if recently asked in same exam type, less likely to repeat
		const lastAsked = topicLastAsked[topic];
		if (lastAsked && lastAsked.examType === targetExamType) {
			score -= 10;
			reasons.push(
				`Recently asked in ${lastAsked.year} ${targetExamType.replace(
					"_",
					" "
				)}`
			);
		}

		// Boost if never asked in target exam type but asked in others (fresh for this exam)
		if (targetFreq === 0 && freq > 0) {
			score += 25;
			reasons.push(
				`Never asked in ${targetExamType.replace(
					"_",
					" "
				)} but covered in other exams`
			);
		}

		topicImportance[topic] = { score, reasons };
	}

	// Sort topics by importance
	const sortedTopics = Object.entries(topicImportance)
		.sort((a, b) => b[1].score - a[1].score)
		.slice(0, 20);

	return {
		moduleFrequency,
		topicFrequency,
		topicByExamType,
		marksDistribution,
		questionTypes,
		sampleQuestions,
		otherExamQuestions,
		repeatedTopics,
		topicLastAsked,
		topicImportance: Object.fromEntries(sortedTopics),
		totalQuestions: questions.length,
		questionsByExamType: {
			MIDTERM_1: questionsByExamType.MIDTERM_1.length,
			MIDTERM_2: questionsByExamType.MIDTERM_2.length,
			END_TERM: questionsByExamType.END_TERM.length,
		},
	};
}

/**
 * Perform web search for recent trends (mock implementation)
 * In production, you'd integrate with Google Search API or similar
 */
async function searchWebTrends(
	subjectName: string,
	topics: string[]
): Promise<string[]> {
	// This would be replaced with actual web search API
	// For now, return placeholder trends
	return [
		`Recent focus on practical applications of ${topics[0] || subjectName}`,
		`Industry trends showing increased importance of ${
			topics[1] || "core concepts"
		}`,
		`Academic emphasis on ${topics[2] || "problem-solving"} skills`,
	];
}

// ============ MAIN PREDICTION FUNCTION ============

/**
 * Generate exam predictions based on syllabus scope and comprehensive PYQ analysis
 * IMPORTANT: Analyzes ALL questions from ALL exam types, then predicts for target exam
 */
export async function generatePredictions(
	config: PredictionConfig
): Promise<PredictionResult> {
	const {
		subjectId,
		examType,
		syllabusScope,
		questionCount = 10,
		useWebSearch = false,
		useThinkingModel = true,
		useGemini3 = false, // NEW: Default to false (use stable Gemini 2.5 Pro)
		model = "gemini-2.5-pro", // NEW: Default model
	} = config;

	try {
		// 1. Get syllabus data
		const syllabus = await getSyllabusData(subjectId);
		if (!syllabus) {
			return {
				success: false,
				predictions: [],
				metadata: {
					subjectName: "",
					subjectCode: "",
					examType,
					totalPYQsAnalyzed: 0,
					modulesIncluded: [],
					generatedAt: new Date(),
					modelUsed: "",
					confidence: 0,
				},
				error: "Syllabus not found for this subject",
			};
		}

		// 2. Build filtered syllabus based on scope
		const filteredSyllabus = buildFilteredSyllabus(
			syllabus.modules.map((m) => ({
				number: m.number,
				name: m.name,
				topics: m.topics.map((t) => ({
					name: t.name,
					description: t.description,
				})),
			})),
			syllabusScope
		);

		if (filteredSyllabus.length === 0) {
			return {
				success: false,
				predictions: [],
				metadata: {
					subjectName: syllabus.subject.name,
					subjectCode: syllabus.subject.code,
					examType,
					totalPYQsAnalyzed: 0,
					modulesIncluded: [],
					generatedAt: new Date(),
					modelUsed: "",
					confidence: 0,
				},
				error:
					"No modules/topics included in scope. Please select at least one module.",
			};
		}

		// 3. Get ALL PYQ data (ALL EXAM TYPES) for comprehensive analysis
		const allPYQData = await getAllPYQData(subjectId);
		const patterns = analyzeAllPYQPatterns(
			allPYQData.map((q) => ({
				text: q.text,
				marks: q.marks,
				questionType: q.questionType,
				difficulty: q.difficulty,
				module: q.module,
				topic: q.topic,
				exam: {
					examType: q.exam.examType,
					academicYear: q.exam.academicYear,
				},
			})),
			examType // Target exam type for prediction
		);

		// 4. Get web trends if enabled
		let webTrends: string[] = [];
		if (useWebSearch) {
			const allTopics = filteredSyllabus.flatMap((m) => m.topics);
			webTrends = await searchWebTrends(syllabus.subject.name, allTopics);
		}

		// 4.5. Get notes for this subject (NEW: Use uploaded study materials)
		const notes = await prisma.note.findMany({
			where: {
				subjectId,
				isPublic: true, // Only use public notes
			},
			select: {
				title: true,
				extractedText: true,
				keyTopics: true,
				moduleNumbers: true,
			},
		});

		// Filter notes by selected modules
		const includedModuleNumbers = filteredSyllabus.map((m) => m.module);
		const relevantNotes = notes.filter((note) =>
			note.moduleNumbers.some((num) => includedModuleNumbers.includes(num))
		);

		console.log(
			`Found ${notes.length} notes, ${relevantNotes.length} relevant to selected modules`
		);

		// 5. Build the comprehensive prompt with ALL analysis data
		const examTypeLabel = examType.replace("_", " ");
		const modelToUse = model; // Use the selected model from config

		const prompt = `You are an expert exam question predictor for university examinations. Your task is to predict likely questions for an upcoming ${examTypeLabel} exam.

## SUBJECT INFORMATION
- Subject: ${syllabus.subject.name}
- Code: ${syllabus.subject.code}
- Target Exam: ${examTypeLabel}
- Total Marks: ${examType === "END_TERM" ? 60 : 30}

## SYLLABUS SCOPE (Topics to focus on for this exam)
${JSON.stringify(filteredSyllabus, null, 2)}

${
	relevantNotes.length > 0
		? `## STUDY MATERIALS & NOTES
I have access to ${relevantNotes.length} notes/study materials for this subject:

${relevantNotes
	.map(
		(note, i) => `### Note ${i + 1}: ${note.title}
Key Topics: ${note.keyTopics.join(", ")}
Content Excerpt: ${
			note.extractedText ? note.extractedText.substring(0, 1000) + "..." : "N/A"
		}
`
	)
	.join("\n")}

`
		: ""
}
## COMPREHENSIVE QUESTION ANALYSIS
I have analyzed ALL questions from this subject across ALL exam types:

### Question Distribution by Exam Type:
- Midterm 1: ${patterns.questionsByExamType.MIDTERM_1} questions
- Midterm 2: ${patterns.questionsByExamType.MIDTERM_2} questions  
- End Term: ${patterns.questionsByExamType.END_TERM} questions
- TOTAL: ${patterns.totalQuestions} questions analyzed

### Topic Importance Scores (Higher = More Likely to Appear):
${JSON.stringify(patterns.topicImportance, null, 2)}

### Topics Asked Across Different Exam Types:
${JSON.stringify(patterns.topicByExamType, null, 2)}

### Repeated Topics (Asked Multiple Times - IMPORTANT):
${JSON.stringify(patterns.repeatedTopics, null, 2)}

### Module Frequency:
${JSON.stringify(patterns.moduleFrequency, null, 2)}

### Marks Distribution Pattern:
${JSON.stringify(patterns.marksDistribution, null, 2)}

### Question Types Used:
${JSON.stringify(patterns.questionTypes, null, 2)}

${
	patterns.sampleQuestions.length > 0
		? `
### Sample Questions from ${examTypeLabel} (Match This Style):
${JSON.stringify(patterns.sampleQuestions, null, 2)}
`
		: ""
}

${
	patterns.otherExamQuestions.length > 0
		? `
### Questions from OTHER Exam Types (Reference for Pattern):
${JSON.stringify(patterns.otherExamQuestions, null, 2)}
`
		: ""
}

${
	webTrends.length > 0
		? `
## CURRENT TRENDS
${webTrends.map((t, i) => `${i + 1}. ${t}`).join("\n")}
`
		: ""
}

## PREDICTION STRATEGY
Based on my analysis:
1. **High Priority Topics**: Topics with high importance scores that haven't been asked recently in ${examTypeLabel}
2. **Repeated Topics**: Topics asked multiple times across exams are VERY important
3. **Fresh Topics**: Topics asked in other exam types but not in ${examTypeLabel} are good candidates
4. **Pattern Matching**: Use the marks distribution and question types that match ${examTypeLabel}

## INSTRUCTIONS
Generate exactly ${questionCount} predicted exam questions for ${examTypeLabel}. For each question:

1. **Focus on high-importance topics** from the analysis
2. **Match the question style** of previous ${examTypeLabel} exams
3. **Include mix of question types** based on the pattern (${Object.entries(
			patterns.questionTypes
		)
			.map(([k, v]) => `${k}: ${v}`)
			.join(", ")})
4. **Use appropriate marks** based on ${examTypeLabel} pattern
5. **Prioritize**:
   - Topics with high importance scores
   - Repeated topics that appear across multiple exams
   - Topics not recently asked in ${examTypeLabel}
   - Topics from the selected syllabus scope

6. **Provide detailed reasoning** explaining WHY each question is predicted

## OUTPUT FORMAT
Return ONLY valid JSON in this exact format:
{
  "predictions": [
    {
      "id": "pred_1",
      "text": "Full question text exactly as it would appear in exam paper",
      "probability": 0.85,
      "module": "Module Name",
      "topic": "Topic Name",  
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "questionType": "SHORT" | "LONG" | "DESCRIPTIVE" | "MCQ",
      "marks": 5,
      "reasoning": [
        "Based on topic importance score of X",
        "Asked Y times across different exams",
        "Not asked in recent ${examTypeLabel}",
        "Matches the typical question pattern"
      ],
      "source": "pattern_analysis" | "topic_freshness" | "ai_reasoning"
    }
  ]
}

CRITICAL RULES:
- Generate questions ONLY from the topics listed in SYLLABUS SCOPE
- Do NOT generate questions from excluded modules or topics
- Match the question style to ${examTypeLabel} format
- Use the topic importance data to prioritize predictions
- Return ONLY the JSON, no markdown or extra text`;

		console.log(`Generating predictions using model: ${modelToUse}`);
		console.log(`Total questions analyzed: ${patterns.totalQuestions}`);
		console.log(`Questions by exam type:`, patterns.questionsByExamType);

		if (useGemini3) {
			console.warn(
				"⚠️ Using Gemini 3.0 Preview - Limited to ~30-50 requests/day"
			);
		}

		// 6. Generate predictions with advanced thinking for better reasoning
		let response;
		if (useThinkingModel) {
			// Use thinking model for complex reasoning (higher accuracy)
			console.log("Using advanced thinking model with extended reasoning...");
			// Pass model name directly to generateWithThinking
			response = await generateWithThinking(prompt, 24576, false, modelToUse);
		} else {
			// Use fast model for quick predictions
			response = await gemini.models.generateContent({
				model: modelToUse,
				contents: prompt,
			});
		}

		const responseText = response.text || "";

		// 7. Parse JSON response
		let jsonText = responseText.trim();
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

		const parsed = JSON.parse(jsonText);

		// 8. Validate and process predictions
		const predictions: PredictedQuestion[] = parsed.predictions.map(
			(
				p: {
					id?: string;
					text: string;
					probability: number;
					module: string;
					topic: string;
					difficulty: string;
					questionType: string;
					marks: number;
					reasoning: string[];
					source?: string;
				},
				index: number
			) => ({
				id: p.id || `pred_${index + 1}`,
				text: p.text,
				probability: Math.min(1, Math.max(0, p.probability)),
				module: p.module,
				topic: p.topic,
				difficulty: (["EASY", "MEDIUM", "HARD"].includes(p.difficulty)
					? p.difficulty
					: "MEDIUM") as Difficulty,
				questionType: (["MCQ", "SHORT", "LONG", "DESCRIPTIVE"].includes(
					p.questionType
				)
					? p.questionType
					: "SHORT") as QuestionType,
				marks: p.marks,
				reasoning: p.reasoning || [],
				source: p.source || "ai_reasoning",
			})
		);

		// 9. Calculate overall confidence
		const avgProbability =
			predictions.reduce((sum, p) => sum + p.probability, 0) /
			predictions.length;

		// 10. Save prediction to database
		await prisma.prediction.create({
			data: {
				targetExamType: examType,
				subjectId,
				confidence: avgProbability,
				modelVersion: modelToUse,
				questions: {
					create: predictions.map((p) => ({
						generatedText: p.text,
						probability: p.probability,
						reasoning: p.reasoning,
						suggestedMarks: p.marks,
						targetModule: p.module,
						targetTopic: p.topic,
					})),
				},
			},
		});

		return {
			success: true,
			predictions,
			metadata: {
				subjectName: syllabus.subject.name,
				subjectCode: syllabus.subject.code,
				examType,
				totalPYQsAnalyzed: patterns.totalQuestions,
				questionsByExamType: patterns.questionsByExamType,
				modulesIncluded: filteredSyllabus.map(
					(m) => `Module ${m.module}: ${m.name}`
				),
				generatedAt: new Date(),
				modelUsed: modelToUse,
				confidence: avgProbability,
			},
		};
	} catch (error) {
		console.error("Prediction error:", error);
		return {
			success: false,
			predictions: [],
			metadata: {
				subjectName: "",
				subjectCode: "",
				examType,
				totalPYQsAnalyzed: 0,
				modulesIncluded: [],
				generatedAt: new Date(),
				modelUsed: "",
				confidence: 0,
			},
			error:
				error instanceof Error
					? error.message
					: "Failed to generate predictions",
		};
	}
}

/**
 * Get syllabus scope for UI initialization
 */
export async function getSyllabusScope(
	subjectId: string
): Promise<ModuleScope[]> {
	const syllabus = await getSyllabusData(subjectId);

	if (!syllabus) {
		return [];
	}

	return syllabus.modules.map((module) => ({
		moduleNumber: module.number,
		moduleName: module.name,
		included: true, // Default all included
		excludedTopics: [],
		topics: module.topics.map((topic) => ({
			name: topic.name,
			included: true,
		})),
	}));
}
