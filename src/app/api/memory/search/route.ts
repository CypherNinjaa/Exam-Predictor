import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET /api/memory/search - Smart memory search
export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const query = searchParams.get("q")?.toLowerCase() || "";
		const category = searchParams.get("category");
		const limit = parseInt(searchParams.get("limit") || "10");

		if (!query) {
			return NextResponse.json(
				{ error: "Search query is required" },
				{ status: 400 }
			);
		}

		// Find memories that match keywords or content
		const memories = await prisma.userMemory.findMany({
			where: {
				userId,
				isActive: true,
				...(category && { category: category as any }),
				OR: [
					{
						keywords: {
							hasSome: query.split(" "),
						},
					},
					{
						title: {
							contains: query,
							mode: "insensitive",
						},
					},
					{
						content: {
							contains: query,
							mode: "insensitive",
						},
					},
				],
			},
			orderBy: [{ importance: "desc" }, { timesUsed: "desc" }],
			take: limit,
		});

		// Update usage stats
		if (memories.length > 0) {
			await prisma.userMemory.updateMany({
				where: {
					id: {
						in: memories.map((m) => m.id),
					},
				},
				data: {
					timesUsed: {
						increment: 1,
					},
					lastUsedAt: new Date(),
				},
			});
		}

		return NextResponse.json({
			memories,
			query,
			count: memories.length,
		});
	} catch (error) {
		console.error("Failed to search memories:", error);
		return NextResponse.json(
			{ error: "Failed to search memories" },
			{ status: 500 }
		);
	}
}
