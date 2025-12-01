/**
 * API Route: Upload and process PYQ (Previous Year Questions) PDF
 * POST /api/upload-pyq
 */

import { NextRequest, NextResponse } from "next/server";
import {
	uploadAndExtractPYQ,
	generateFileHash,
	checkPYQDuplicate,
} from "@/lib/pyq-extractor";
import { ExamType } from "@prisma/client";

export const maxDuration = 60; // 60 seconds for Vercel

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();

		// Get file
		const file = formData.get("file") as File | null;
		if (!file) {
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}

		// Validate file type
		if (file.type !== "application/pdf") {
			return NextResponse.json(
				{ error: "Only PDF files are allowed" },
				{ status: 400 }
			);
		}

		// Get required fields
		const subjectId = formData.get("subjectId") as string;
		const semesterId = formData.get("semesterId") as string;
		const academicYear = formData.get("academicYear") as string;
		const examType = formData.get("examType") as ExamType;
		const forceReplace = formData.get("forceReplace") === "true";

		// Validate required fields
		if (!subjectId || !semesterId || !academicYear || !examType) {
			return NextResponse.json(
				{
					error:
						"Missing required fields: subjectId, semesterId, academicYear, examType",
				},
				{ status: 400 }
			);
		}

		// Validate exam type
		const validExamTypes: ExamType[] = ["MIDTERM_1", "MIDTERM_2", "END_TERM"];
		if (!validExamTypes.includes(examType)) {
			return NextResponse.json(
				{
					error: "Invalid exam type. Must be MIDTERM_1, MIDTERM_2, or END_TERM",
				},
				{ status: 400 }
			);
		}

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Check for duplicates before processing (to give early feedback)
		const fileHash = generateFileHash(buffer);
		const duplicate = await checkPYQDuplicate(
			subjectId,
			examType,
			semesterId,
			academicYear,
			fileHash
		);

		if (duplicate.isDuplicate && !forceReplace) {
			return NextResponse.json(
				{
					error: "Duplicate PYQ paper detected",
					isDuplicate: true,
					existingExamId: duplicate.existingExam?.id,
					message:
						"This paper already exists. Set forceReplace=true to replace it.",
				},
				{ status: 409 }
			);
		}

		// Process the PYQ
		console.log(`Processing PYQ: ${file.name}`);
		const result = await uploadAndExtractPYQ(
			buffer,
			subjectId,
			semesterId,
			academicYear,
			examType,
			forceReplace
		);

		if (!result.success) {
			return NextResponse.json(
				{
					error: result.error || "Failed to process PYQ",
					isDuplicate: result.isDuplicate,
				},
				{ status: result.isDuplicate ? 409 : 500 }
			);
		}

		return NextResponse.json({
			success: true,
			examId: result.examId,
			questionsCount: result.questionsCount,
			message: `Successfully extracted ${result.questionsCount} questions`,
			extractedInfo: result.extractedData?.examInfo,
		});
	} catch (error) {
		console.error("Error processing PYQ upload:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 }
		);
	}
}
