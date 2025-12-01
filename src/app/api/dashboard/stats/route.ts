import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
	try {
		const [totalSubjects, totalExams, totalQuestions] = await Promise.all([
			prisma.subject.count(),
			prisma.exam.count(),
			prisma.question.count(),
		]);

		const processedPapers = await prisma.processingLog.count({
			where: { status: "completed" },
		});

		const pendingPapers = await prisma.processingLog.count({
			where: { status: { in: ["pending", "processing"] } },
		});

		return NextResponse.json({
			totalSubjects,
			totalExams,
			totalQuestions,
			processedPapers,
			pendingPapers,
		});
	} catch (error) {
		console.error("Dashboard Stats Error:", error);
		return NextResponse.json({
			totalSubjects: 0,
			totalExams: 0,
			totalQuestions: 0,
			processedPapers: 0,
			pendingPapers: 0,
		});
	}
}
