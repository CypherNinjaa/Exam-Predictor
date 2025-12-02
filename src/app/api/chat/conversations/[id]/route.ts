import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET /api/chat/conversations/[id] - Get conversation with messages
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		const conversation = await prisma.chatConversation.findFirst({
			where: {
				id,
				userId, // Ensure user owns this conversation
			},
			include: {
				messages: {
					orderBy: { createdAt: "asc" },
					select: {
						id: true,
						role: true,
						text: true,
						createdAt: true,
					},
				},
			},
		});

		if (!conversation) {
			return NextResponse.json(
				{ error: "Conversation not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(conversation);
	} catch (error) {
		console.error("Failed to fetch conversation:", error);
		return NextResponse.json(
			{ error: "Failed to fetch conversation" },
			{ status: 500 }
		);
	}
}

// PATCH /api/chat/conversations/[id] - Update conversation (rename)
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
		const { title } = await request.json();

		if (!title || typeof title !== "string" || title.trim().length === 0) {
			return NextResponse.json({ error: "Title is required" }, { status: 400 });
		}

		// Verify ownership
		const conversation = await prisma.chatConversation.findFirst({
			where: {
				id,
				userId,
			},
		});

		if (!conversation) {
			return NextResponse.json(
				{ error: "Conversation not found" },
				{ status: 404 }
			);
		}

		// Update conversation title
		const updatedConversation = await prisma.chatConversation.update({
			where: { id },
			data: {
				title: title.trim(),
				updatedAt: new Date(),
			},
		});

		return NextResponse.json(updatedConversation);
	} catch (error) {
		console.error("Failed to update conversation:", error);
		return NextResponse.json(
			{ error: "Failed to update conversation" },
			{ status: 500 }
		);
	}
}

// DELETE /api/chat/conversations/[id] - Delete conversation
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
		const conversation = await prisma.chatConversation.findFirst({
			where: {
				id,
				userId,
			},
		});

		if (!conversation) {
			return NextResponse.json(
				{ error: "Conversation not found" },
				{ status: 404 }
			);
		}

		// Delete conversation (messages will be deleted via cascade)
		await prisma.chatConversation.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete conversation:", error);
		return NextResponse.json(
			{ error: "Failed to delete conversation" },
			{ status: 500 }
		);
	}
}
