import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET /api/memory - List all memories for user
export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const category = searchParams.get("category");
		const isActive = searchParams.get("isActive");

		const memories = await prisma.userMemory.findMany({
			where: {
				userId,
				...(category && { category: category as any }),
				...(isActive !== null && { isActive: isActive === "true" }),
			},
			orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
		});

		// Group by category
		const grouped = memories.reduce((acc: any, memory) => {
			if (!acc[memory.category]) {
				acc[memory.category] = [];
			}
			acc[memory.category].push(memory);
			return acc;
		}, {});

		return NextResponse.json({
			memories,
			grouped,
			total: memories.length,
			stats: {
				academic: memories.filter((m) => m.category === "ACADEMIC").length,
				personal: memories.filter((m) => m.category === "PERSONAL").length,
				preferences: memories.filter((m) => m.category === "PREFERENCES")
					.length,
				goals: memories.filter((m) => m.category === "GOALS").length,
				studyPattern: memories.filter((m) => m.category === "STUDY_PATTERN")
					.length,
				other: memories.filter((m) => m.category === "OTHER").length,
			},
		});
	} catch (error) {
		console.error("Failed to fetch memories:", error);
		return NextResponse.json(
			{ error: "Failed to fetch memories" },
			{ status: 500 }
		);
	}
}

// POST /api/memory - Create new memory
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const {
			title,
			content,
			category = "OTHER",
			importance = "MEDIUM",
			keywords = [],
			relatedTo,
			source = "user",
			sourceConversationId,
		} = body;

		if (!title || !content) {
			return NextResponse.json(
				{ error: "Title and content are required" },
				{ status: 400 }
			);
		}

		const memory = await prisma.userMemory.create({
			data: {
				userId,
				title,
				content,
				category,
				importance,
				keywords,
				relatedTo,
				source,
				sourceConversationId,
			},
		});

		return NextResponse.json(memory, { status: 201 });
	} catch (error) {
		console.error("Failed to create memory:", error);
		return NextResponse.json(
			{ error: "Failed to create memory" },
			{ status: 500 }
		);
	}
}
