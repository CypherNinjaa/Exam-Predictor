import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import {
	extractSyllabusFromPDF,
	saveSyllabusToDatabase,
} from "@/lib/syllabus-extractor";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for AI processing

export async function POST(request: NextRequest) {
	let logId: string | null = null;

	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const type = formData.get("type") as string;
		const subjectId = formData.get("subjectId") as string;
		const examType = formData.get("examType") as string;

		if (!file) {
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}

		// Validate file type
		if (!file.name.endsWith(".pdf")) {
			return NextResponse.json(
				{ error: "Only PDF files are allowed" },
				{ status: 400 }
			);
		}

		// Get subject details for folder organization
		let subjectCode = "unknown";
		if (subjectId) {
			const subject = await prisma.subject.findUnique({
				where: { id: subjectId },
				select: { code: true, name: true },
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
				status: "processing",
			},
		});
		logId = log.id;

		// Process based on upload type
		if (type === "syllabus" && subjectId) {
			try {
				// Extract syllabus using AI
				console.log("Starting AI extraction for syllabus...");
				const extractedData = await extractSyllabusFromPDF(buffer);
				console.log(
					"Extraction complete:",
					JSON.stringify(extractedData, null, 2)
				);

				// Save to database
				const syllabusId = await saveSyllabusToDatabase(
					subjectId,
					extractedData,
					filepath
				);

				// Update processing log
				await prisma.processingLog.update({
					where: { id: logId },
					data: {
						status: "completed",
						processedAt: new Date(),
					},
				});

				return NextResponse.json({
					success: true,
					message: "Syllabus uploaded and processed successfully",
					data: {
						logId,
						filename,
						type,
						subjectId,
						syllabusId,
						extractedModules: extractedData.modules.length,
						extractedTopics: extractedData.modules.reduce(
							(acc, m) => acc + m.topics.length,
							0
						),
						extractedBooks: extractedData.books.length,
					},
				});
			} catch (extractError) {
				console.error("AI Extraction Error:", extractError);

				// Update log with error
				await prisma.processingLog.update({
					where: { id: logId },
					data: {
						status: "failed",
						errorMsg:
							extractError instanceof Error
								? extractError.message
								: "AI extraction failed",
					},
				});

				// Still save the PDF even if extraction fails
				await prisma.syllabus.upsert({
					where: { subjectId },
					update: { pdfUrl: filepath },
					create: {
						subjectId,
						pdfUrl: filepath,
					},
				});

				return NextResponse.json({
					success: true,
					message:
						"PDF saved but AI extraction failed. You can try processing again later.",
					data: {
						logId,
						filename,
						type,
						subjectId,
						extractionError:
							extractError instanceof Error
								? extractError.message
								: "Unknown error",
					},
				});
			}
		}

		// Handle exam paper upload
		if (type === "exam" && subjectId && examType) {
			const subject = await prisma.subject.findUnique({
				where: { id: subjectId },
				select: { semesterId: true },
			});

			if (subject) {
				// Create or update exam record
				await prisma.exam.upsert({
					where: {
						subjectId_examType_semesterId: {
							subjectId,
							examType: examType as "MIDTERM_1" | "MIDTERM_2" | "END_TERM",
							semesterId: subject.semesterId,
						},
					},
					update: {
						pdfUrl: filepath,
						isProcessed: false,
					},
					create: {
						subjectId,
						semesterId: subject.semesterId,
						examType: examType as "MIDTERM_1" | "MIDTERM_2" | "END_TERM",
						pdfUrl: filepath,
					},
				});
			}

			await prisma.processingLog.update({
				where: { id: logId },
				data: {
					status: "completed",
					processedAt: new Date(),
				},
			});
		}

		// Handle lecture notes upload
		if (type === "notes" && subjectId) {
			await prisma.lectureNote.create({
				data: {
					subjectCode: subjectCode,
					title: file.name.replace(".pdf", ""),
					content: "", // Will be processed later
					sourceType: "pdf",
					sourceUrl: filepath,
				},
			});

			await prisma.processingLog.update({
				where: { id: logId },
				data: {
					status: "completed",
					processedAt: new Date(),
				},
			});
		}

		return NextResponse.json({
			success: true,
			message: "File uploaded successfully",
			data: {
				logId,
				filename,
				type,
				subjectId,
				examType,
			},
		});
	} catch (error) {
		console.error("Upload Error:", error);

		// Update log if exists
		if (logId) {
			await prisma.processingLog.update({
				where: { id: logId },
				data: {
					status: "failed",
					errorMsg: error instanceof Error ? error.message : "Unknown error",
				},
			});
		}

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Failed to upload file",
			},
			{ status: 500 }
		);
	}
}

// GET endpoint to check processing status
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const logId = searchParams.get("logId");

		if (!logId) {
			return NextResponse.json({ error: "Log ID required" }, { status: 400 });
		}

		const log = await prisma.processingLog.findUnique({
			where: { id: logId },
		});

		if (!log) {
			return NextResponse.json({ error: "Log not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			data: log,
		});
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to get status" },
			{ status: 500 }
		);
	}
}
