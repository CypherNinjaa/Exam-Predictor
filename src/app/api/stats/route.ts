import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering - don't prerender at build time
export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const [subjects, questions, predictions] = await Promise.all([
			prisma.subject.count(),
			prisma.question.count(),
			prisma.prediction.count(),
		]);

		// Calculate average accuracy from validated predictions
		const validatedPredictions = await prisma.prediction.findMany({
			where: { isValidated: true, accuracyScore: { not: null } },
		});

		const accuracy =
			validatedPredictions.length > 0
				? Math.round(
						(validatedPredictions.reduce(
							(sum, p) => sum + (p.accuracyScore || 0),
							0
						) /
							validatedPredictions.length) *
							100
				  )
				: 0;

		return NextResponse.json({
			subjects,
			questions,
			predictions,
			accuracy,
		});
	} catch (error) {
		console.error("Stats API Error:", error);
		return NextResponse.json({
			subjects: 0,
			questions: 0,
			predictions: 0,
			accuracy: 0,
		});
	}
}
