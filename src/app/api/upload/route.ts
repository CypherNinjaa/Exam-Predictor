import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const type = formData.get("type") as string;
		const subjectId = formData.get("subjectId") as string;
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

		// Get subject details for folder organization
		let subjectCode = "unknown";
		if (subjectId) {
			const subject = await prisma.subject.findUnique({
				where: { id: subjectId },
				select: { code: true },
			});
			if (subject) {
				subjectCode = subject.code;
			}
		}

		// Create upload directory
		const uploadDir = join(process.cwd(), "data", "uploads", type, subjectCode);
		await mkdir(uploadDir, { recursive: true });

		// Generate filename
		const timestamp = Date.now();
		const filename = `${subjectCode}_${examType || type}_${timestamp}.pdf`;
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

		// If uploading a syllabus, create/update the syllabus record
		if (type === "syllabus" && subjectId) {
			// Check if syllabus exists for this subject
			const existingSyllabus = await prisma.syllabus.findUnique({
				where: { subjectId },
			});

			if (existingSyllabus) {
				await prisma.syllabus.update({
					where: { subjectId },
					data: { pdfUrl: filepath },
				});
			} else {
				await prisma.syllabus.create({
					data: {
						subjectId,
						pdfUrl: filepath,
					},
				});
			}
		}

		return NextResponse.json({
			message: "File uploaded successfully",
			data: {
				logId: log.id,
				filename,
				type,
				subjectId,
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
