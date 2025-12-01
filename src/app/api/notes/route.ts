/**
 * API Route: Public Notes Access
 * GET /api/notes - List public notes (students can access)
 * GET /api/notes/download?id=xyz - Track download count
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: List public notes (optionally filtered by subject)
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const subjectId = searchParams.get("subjectId");
		const download = searchParams.get("download");
		const noteId = searchParams.get("id");

		// Handle download tracking
		if (download === "true" && noteId) {
			await prisma.note.update({
				where: { id: noteId, isPublic: true },
				data: {
					downloadCount: { increment: 1 },
				},
			});

			return NextResponse.json({
				success: true,
				message: "Download tracked",
			});
		}

		// List notes
		const where: any = { isPublic: true };
		if (subjectId) {
			where.subjectId = subjectId;
		}

		const notes = await prisma.note.findMany({
			where,
			select: {
				id: true,
				title: true,
				description: true,
				fileName: true,
				fileUrl: true,
				fileType: true,
				fileSize: true,
				keyTopics: true,
				moduleNumbers: true,
				downloadCount: true,
				createdAt: true,
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
		console.error("Public notes error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch notes" },
			{ status: 500 }
		);
	}
}
