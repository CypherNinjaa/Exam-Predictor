import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const courseId = searchParams.get("courseId");

		if (!courseId) {
			return NextResponse.json({ success: true, data: [] });
		}

		const batches = await prisma.batch.findMany({
			where: { courseId },
			select: {
				id: true,
				startYear: true,
				endYear: true,
			},
			orderBy: { startYear: "desc" },
		});

		return NextResponse.json({ success: true, data: batches });
	} catch (error) {
		console.error("Batches API Error:", error);
		return NextResponse.json({
			success: false,
			data: [],
			error: "Failed to fetch batches",
		});
	}
}
