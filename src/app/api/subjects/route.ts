import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering - don't prerender at build time
export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const subjects = await prisma.subject.findMany({
			select: {
				id: true,
				code: true,
				name: true,
			},
			orderBy: { code: "asc" },
		});

		return NextResponse.json({ subjects });
	} catch (error) {
		console.error("Subjects API Error:", error);
		return NextResponse.json({ subjects: [] });
	}
}
