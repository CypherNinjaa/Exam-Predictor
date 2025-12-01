import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const college = await prisma.college.findFirst();
		if (!college) {
			return NextResponse.json({ success: true, data: [] });
		}

		const courses = await prisma.course.findMany({
			where: { collegeId: college.id },
			select: {
				id: true,
				code: true,
				name: true,
			},
			orderBy: { name: "asc" },
		});

		return NextResponse.json({ success: true, data: courses });
	} catch (error) {
		console.error("Courses API Error:", error);
		return NextResponse.json({
			success: false,
			data: [],
			error: "Failed to fetch courses",
		});
	}
}
