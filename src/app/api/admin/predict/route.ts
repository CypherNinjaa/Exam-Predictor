/**
 * API Route: Advanced Question Prediction
 * POST /api/admin/predict
 */

import { NextRequest, NextResponse } from "next/server";
import {
	generatePredictions,
	getSyllabusScope,
	ModuleScope,
	PredictionConfig,
} from "@/lib/prediction-engine";
import { ExamType } from "@prisma/client";

export const maxDuration = 120; // 2 minutes for complex predictions

// POST: Generate predictions
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			subjectId,
			examType,
			syllabusScope,
			questionCount,
			useWebSearch,
			useThinkingModel,
			model,
		} = body;

		// Validate required fields
		if (!subjectId) {
			return NextResponse.json(
				{ error: "Subject ID is required" },
				{ status: 400 }
			);
		}

		if (!examType) {
			return NextResponse.json(
				{ error: "Exam type is required" },
				{ status: 400 }
			);
		}

		// Validate exam type
		const validExamTypes: ExamType[] = ["MIDTERM_1", "MIDTERM_2", "END_TERM"];
		if (!validExamTypes.includes(examType)) {
			return NextResponse.json({ error: "Invalid exam type" }, { status: 400 });
		}

		// If no syllabus scope provided, get default (all included)
		let scope: ModuleScope[] = syllabusScope;
		if (!scope || scope.length === 0) {
			scope = await getSyllabusScope(subjectId);
			if (scope.length === 0) {
				return NextResponse.json(
					{
						error:
							"No syllabus found for this subject. Please upload a syllabus first.",
					},
					{ status: 404 }
				);
			}
		}

		const config: PredictionConfig = {
			subjectId,
			examType,
			syllabusScope: scope,
			questionCount: questionCount || 10,
			useWebSearch: useWebSearch || false,
			useThinkingModel: useThinkingModel !== false, // Default true
			model: model || "gemini-2.5-pro", // Default to Gemini 2.5 Pro
		};

		console.log("Starting prediction with config:", {
			subjectId,
			examType,
			modulesIncluded: scope.filter((s) => s.included).length,
			questionCount: config.questionCount,
		});

		const result = await generatePredictions(config);

		if (!result.success) {
			return NextResponse.json(
				{ error: result.error || "Prediction failed" },
				{ status: 500 }
			);
		}

		return NextResponse.json(result);
	} catch (error) {
		console.error("Prediction API Error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 }
		);
	}
}

// GET: Get syllabus scope for a subject
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const subjectId = searchParams.get("subjectId");

		if (!subjectId) {
			return NextResponse.json(
				{ error: "Subject ID is required" },
				{ status: 400 }
			);
		}

		const scope = await getSyllabusScope(subjectId);

		if (scope.length === 0) {
			return NextResponse.json(
				{
					error: "No syllabus found for this subject",
					scope: [],
				},
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			scope,
		});
	} catch (error) {
		console.error("Get Scope Error:", error);
		return NextResponse.json(
			{ error: "Failed to get syllabus scope" },
			{ status: 500 }
		);
	}
}
