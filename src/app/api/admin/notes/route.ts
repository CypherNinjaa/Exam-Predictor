/**
 * API Route: Notes Management
 * POST /api/admin/notes - Upload and process notes
 * GET /api/admin/notes - List all notes (admin view)
 * DELETE /api/admin/notes?id=xyz - Delete a note
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
	extractNoteContent,
	saveNoteFile,
	deleteNoteFile,
} from "@/lib/notes-extractor";

export const maxDuration = 300; // 5 minutes for large file processing

// POST: Upload and process note
export async function POST(request: NextRequest) {
	try {
		// Check authentication
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Parse form data
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const subjectId = formData.get("subjectId") as string;
		const title = formData.get("title") as string;
		const description = formData.get("description") as string;
		const isPublic = formData.get("isPublic") === "true";

		// Validate inputs
		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		if (!subjectId) {
			return NextResponse.json(
				{ error: "Subject ID is required" },
				{ status: 400 }
			);
		}

		if (!title || title.trim() === "") {
			return NextResponse.json({ error: "Title is required" }, { status: 400 });
		}

		// Validate subject exists
		const subject = await prisma.subject.findUnique({
			where: { id: subjectId },
		});

		if (!subject) {
			return NextResponse.json({ error: "Subject not found" }, { status: 404 });
		}

		// Get file details
		const fileName = file.name;
		const fileSize = file.size;
		const fileType = fileName.split(".").pop() || "unknown";

		console.log(`Processing note: ${fileName} (${fileSize} bytes)`);

		// Step 1: Save file to public/uploads/notes/
		const saveResult = await saveNoteFile(file, subject.code);
		if (!saveResult.success) {
			return NextResponse.json(
				{ error: saveResult.error || "Failed to save file" },
				{ status: 500 }
			);
		}

		console.log(`File saved to: ${saveResult.filePath}`);

		// Step 2: Extract content using AI
		const fullPath = `public${saveResult.filePath}`;
		const extractionResult = await extractNoteContent(
			fullPath,
			subjectId,
			fileType
		);

		if (!extractionResult.success) {
			// Clean up saved file on extraction failure
			deleteNoteFile(saveResult.filePath);
			return NextResponse.json(
				{ error: extractionResult.error || "Failed to extract content" },
				{ status: 500 }
			);
		}

		console.log(
			`Extracted ${extractionResult.extractedText.length} characters`
		);
		console.log(`Found ${extractionResult.keyTopics.length} topics`);
		console.log(
			`Mapped to modules: ${extractionResult.moduleNumbers.join(", ")}`
		);

		// Step 3: Save to database
		const note = await prisma.note.create({
			data: {
				title,
				description,
				fileName,
				fileUrl: saveResult.filePath,
				fileType,
				fileSize,
				subjectId,
				extractedText: extractionResult.extractedText,
				keyTopics: extractionResult.keyTopics,
				moduleNumbers: extractionResult.moduleNumbers,
				isPublic,
				uploadedBy: userId,
			},
		});

		return NextResponse.json({
			success: true,
			note: {
				id: note.id,
				title: note.title,
				fileName: note.fileName,
				fileUrl: note.fileUrl,
				fileType: note.fileType,
				fileSize: note.fileSize,
				keyTopics: note.keyTopics,
				moduleNumbers: note.moduleNumbers,
				isPublic: note.isPublic,
				createdAt: note.createdAt,
			},
		});
	} catch (error) {
		console.error("Note upload error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Upload failed",
			},
			{ status: 500 }
		);
	}
}

// GET: List all notes (admin view)
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const subjectId = searchParams.get("subjectId");

		const where = subjectId ? { subjectId } : {};

		const notes = await prisma.note.findMany({
			where,
			include: {
				subject: {
					select: {
						id: true,
						code: true,
						name: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json({
			success: true,
			notes,
		});
	} catch (error) {
		console.error("Get notes error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch notes" },
			{ status: 500 }
		);
	}
}

// DELETE: Delete a note
export async function DELETE(request: NextRequest) {
	try {
		// Check authentication
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ error: "Note ID is required" },
				{ status: 400 }
			);
		}

		// Get note to delete file
		const note = await prisma.note.findUnique({
			where: { id },
		});

		if (!note) {
			return NextResponse.json({ error: "Note not found" }, { status: 404 });
		}

		// Delete file from filesystem
		deleteNoteFile(note.fileUrl);

		// Delete from database
		await prisma.note.delete({
			where: { id },
		});

		return NextResponse.json({
			success: true,
			message: "Note deleted successfully",
		});
	} catch (error) {
		console.error("Delete note error:", error);
		return NextResponse.json(
			{ error: "Failed to delete note" },
			{ status: 500 }
		);
	}
}
