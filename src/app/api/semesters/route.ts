import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const batchId = searchParams.get("batchId");

		if (!batchId) {
			return NextResponse.json({ success: true, data: [] });
		}

		const semesters = await prisma.semester.findMany({
			where: { batchId },
			select: {
				id: true,
				number: true,
			},
			orderBy: { number: "asc" },
		});

		return NextResponse.json({ success: true, data: semesters });
	} catch (error) {
		console.error("Semesters API Error:", error);
		return NextResponse.json({
			success: false,
			data: [],
			error: "Failed to fetch semesters",
		});
	}
}
