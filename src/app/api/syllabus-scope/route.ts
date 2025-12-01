import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const subjectId = searchParams.get("subjectId");

		if (!subjectId) {
			return NextResponse.json({
				success: false,
				error: "Subject ID required",
			});
		}

		// Get syllabus with modules and topics
		const syllabus = await prisma.syllabus.findFirst({
			where: { subjectId },
			include: {
				modules: {
					include: {
						topics: {
							select: {
								id: true,
								name: true,
							},
							orderBy: { name: "asc" },
						},
					},
					orderBy: { number: "asc" },
				},
			},
		});

		if (!syllabus) {
			return NextResponse.json({ success: true, modules: [] });
		}

		// Transform to ModuleScope format
		const modules = syllabus.modules.map((module: any) => ({
			moduleNumber: module.number,
			moduleName: module.name,
			included: true, // Default to all included
			excludedTopics: [],
			topics: module.topics.map((topic: any) => ({
				name: topic.name,
				included: true, // Default to all included
			})),
		}));

		return NextResponse.json({ success: true, modules });
	} catch (error) {
		console.error("Syllabus Scope API Error:", error);
		return NextResponse.json({
			success: false,
			error: "Failed to fetch syllabus scope",
			modules: [],
		});
	}
}
