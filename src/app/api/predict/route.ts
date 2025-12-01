import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gemini } from "@/lib/gemini";

export async function POST(request: NextRequest) {
	try {
		const { subjectId, examType, questionCount } = await request.json();

		if (!subjectId) {
			return NextResponse.json(
				{ message: "Subject ID is required" },
				{ status: 400 }
			);
		}

		// Get subject with syllabus and modules
		const subject = await prisma.subject.findUnique({
			where: { id: subjectId },
			include: {
				syllabi: {
					include: {
						modules: {
							include: {
								topics: true,
							},
						},
					},
				},
			},
		});

		if (!subject) {
			return NextResponse.json(
				{ message: "Subject not found" },
				{ status: 404 }
			);
		}

		// Get historical questions for pattern analysis
		const historicalQuestions = await prisma.question.findMany({
			where: {
				exam: {
					subjectOffering: {
						subjectId: subject.id,
					},
				},
			},
			include: {
				module: true,
				topic: true,
				exam: true,
			},
			orderBy: { createdAt: "desc" },
			take: 100,
		});

		// Build context for Gemini
		const syllabusContent = subject.syllabi
			.flatMap((s) => s.modules)
			.map((m) => ({
				module: m.name,
				topics: m.topics.map((t) => t.name),
			}));

		const questionHistory = historicalQuestions.map((q) => ({
			text: q.text,
			module: q.module?.name,
			topic: q.topic?.name,
			marks: q.marks,
			examType: q.exam.examType,
		}));

		// Get topics with freshness scores
		const topicsWithScores = subject.syllabi
			.flatMap((s) => s.modules)
			.flatMap((m) =>
				m.topics.map((t) => ({
					topic: t.name,
					module: m.name,
					freshnessScore: t.freshnessScore,
					timesAsked: t.timesAsked,
					lastAsked: t.lastAskedDate,
				}))
			)
			.sort((a, b) => b.freshnessScore - a.freshnessScore);

		// Generate predictions using Gemini
		const prompt = `You are an expert exam paper analyzer. Based on the following data, predict ${questionCount} likely exam questions for ${
			subject.name
		} (${subject.code}) for a ${examType} exam.

SYLLABUS STRUCTURE:
${JSON.stringify(syllabusContent, null, 2)}

TOPIC FRESHNESS ANALYSIS (Higher score = more likely to appear):
${JSON.stringify(topicsWithScores.slice(0, 15), null, 2)}

HISTORICAL QUESTIONS (for style reference):
${JSON.stringify(questionHistory.slice(0, 20), null, 2)}

Generate ${questionCount} predicted questions in this exact JSON format:
{
  "predictions": [
    {
      "id": "unique_id",
      "text": "Full question text as it would appear in exam",
      "probability": 0.0 to 1.0,
      "module": "Module name",
      "topic": "Topic name",
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "marks": suggested marks,
      "reasoning": ["reason 1", "reason 2", "reason 3"]
    }
  ]
}

Consider:
1. Topics with high freshness scores (not asked recently)
2. Historical question patterns and styles
3. Mark distribution typical for ${examType} exams
4. Bloom's taxonomy levels for variety
5. Module weightage balance

Return ONLY the JSON, no other text.`;

		const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });
		const result = await model.generateContent(prompt);
		const responseText = result.response.text();

		// Parse JSON from response
		const jsonMatch = responseText.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error("Failed to parse prediction response");
		}

		const predictions = JSON.parse(jsonMatch[0]);

		// Save prediction to database
		await prisma.prediction.create({
			data: {
				targetExamType: examType as any,
				targetYear: new Date().getFullYear(),
				targetSemester: 1,
				subjectCode: subject.code,
				confidence:
					predictions.predictions.reduce(
						(sum: number, p: any) => sum + p.probability,
						0
					) / predictions.predictions.length,
				questions: {
					create: predictions.predictions.map((p: any) => ({
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

		return NextResponse.json(predictions);
	} catch (error) {
		console.error("Prediction Error:", error);
		return NextResponse.json(
			{ message: "Failed to generate predictions", predictions: [] },
			{ status: 500 }
		);
	}
}
