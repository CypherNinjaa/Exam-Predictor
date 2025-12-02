import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// PATCH /api/memory/[id] - Update memory
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const body = await request.json();
		const { title, content, category, importance, keywords, isActive } = body;

		// Verify ownership
		const existingMemory = await prisma.userMemory.findFirst({
			where: { id, userId },
		});

		if (!existingMemory) {
			return NextResponse.json({ error: "Memory not found" }, { status: 404 });
		}

		const updatedMemory = await prisma.userMemory.update({
			where: { id },
			data: {
				...(title && { title }),
				...(content && { content }),
				...(category && { category }),
				...(importance && { importance }),
				...(keywords && { keywords }),
				...(isActive !== undefined && { isActive }),
			},
		});

		return NextResponse.json(updatedMemory);
	} catch (error) {
		console.error("Failed to update memory:", error);
		return NextResponse.json(
			{ error: "Failed to update memory" },
			{ status: 500 }
		);
	}
}

// DELETE /api/memory/[id] - Delete memory
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		// Verify ownership
		const existingMemory = await prisma.userMemory.findFirst({
			where: { id, userId },
		});

		if (!existingMemory) {
			return NextResponse.json({ error: "Memory not found" }, { status: 404 });
		}

		await prisma.userMemory.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete memory:", error);
		return NextResponse.json(
			{ error: "Failed to delete memory" },
			{ status: 500 }
		);
	}
}
