import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering - don't prerender at build time
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const semesterId = searchParams.get("semesterId");

		if (!semesterId) {
			// Return all subjects if no semester specified (backward compatibility)
			const subjects = await prisma.subject.findMany({
				select: {
					id: true,
					code: true,
					name: true,
				},
				orderBy: { code: "asc" },
			});
			return NextResponse.json({ success: true, data: subjects, subjects });
		}

		// Get subjects for specific semester
		const subjects = await prisma.subject.findMany({
			where: { semesterId },
			select: {
				id: true,
				code: true,
				name: true,
			},
			orderBy: { code: "asc" },
		});

		return NextResponse.json({ success: true, data: subjects, subjects });
	} catch (error) {
		console.error("Subjects API Error:", error);
		return NextResponse.json({
			success: false,
			data: [],
			subjects: [],
			error: "Failed to fetch subjects",
		});
	}
}
