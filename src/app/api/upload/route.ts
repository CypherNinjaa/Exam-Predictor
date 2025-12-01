import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const type = formData.get("type") as string;
		const year = parseInt(formData.get("year") as string);
		const semester = parseInt(formData.get("semester") as string);
		const subjectCode = formData.get("subjectCode") as string;
		const examType = formData.get("examType") as string;

		if (!file) {
			return NextResponse.json(
				{ message: "No file uploaded" },
				{ status: 400 }
			);
		}

		// Validate file type
		if (!file.name.endsWith(".pdf")) {
			return NextResponse.json(
				{ message: "Only PDF files are allowed" },
				{ status: 400 }
			);
		}

		// Create upload directory
		const uploadDir = join(process.cwd(), "data", "uploads", type, subjectCode);
		await mkdir(uploadDir, { recursive: true });

		// Generate filename
		const timestamp = Date.now();
		const filename = `${year}_sem${semester}_${
			examType || type
		}_${timestamp}.pdf`;
		const filepath = join(uploadDir, filename);

		// Save file
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);
		await writeFile(filepath, buffer);

		// Create processing log entry
		const log = await prisma.processingLog.create({
			data: {
				fileName: file.name,
				fileType: type === "exam" ? "exam_paper" : type,
				status: "pending",
			},
		});

		return NextResponse.json({
			message: "File uploaded successfully",
			data: {
				logId: log.id,
				filename,
				type,
				year,
				semester,
				subjectCode,
				examType,
			},
		});
	} catch (error) {
		console.error("Upload Error:", error);
		return NextResponse.json(
			{ message: "Failed to upload file" },
			{ status: 500 }
		);
	}
}
