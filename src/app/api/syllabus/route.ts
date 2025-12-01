import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSyllabusForAI, getSyllabusJSON } from "@/lib/syllabus-extractor";

export const dynamic = "force-dynamic";

// GET syllabus by subject ID or syllabus ID
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const subjectId = searchParams.get("subjectId");
		const syllabusId = searchParams.get("syllabusId");
		const format = searchParams.get("format") || "full"; // "full" or "ai"

		if (!subjectId && !syllabusId) {
			return NextResponse.json(
				{ error: "Subject ID or Syllabus ID required" },
				{ status: 400 }
			);
		}

		if (format === "ai" && subjectId) {
			// Get formatted syllabus for AI consumption
			const syllabusData = await getSyllabusForAI(subjectId);

			if (!syllabusData) {
				return NextResponse.json(
					{ error: "Syllabus not found" },
					{ status: 404 }
				);
			}

			return NextResponse.json({
				success: true,
				data: syllabusData,
			});
		}

		// Get full syllabus data
		let syllabus;

		if (syllabusId) {
			syllabus = await getSyllabusJSON(syllabusId);
		} else if (subjectId) {
			const found = await prisma.syllabus.findUnique({
				where: { subjectId },
			});
			if (found) {
				syllabus = await getSyllabusJSON(found.id);
			}
		}

		if (!syllabus) {
			return NextResponse.json(
				{ error: "Syllabus not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: syllabus,
		});
	} catch (error) {
		console.error("Error fetching syllabus:", error);
		return NextResponse.json(
			{ error: "Failed to fetch syllabus" },
			{ status: 500 }
		);
	}
}
