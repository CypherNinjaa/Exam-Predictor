import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { generateVideo } from "@/lib/gemini";

/**
 * POST /api/chat/generate-video
 * Generate videos using Veo 3.1
 */
export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const {
			conversationId,
			prompt,
			model = "fast", // "fast" or "hq"
			aspectRatio = "16:9",
			resolution = "720p",
			referenceImage, // Optional: { base64, mimeType }
			lastFrame, // Optional: { base64, mimeType }
		} = body;

		if (!conversationId || !prompt) {
			return NextResponse.json(
				{ error: "Conversation ID and prompt are required" },
				{ status: 400 }
			);
		}

		// Verify conversation ownership
		const conversation = await prisma.chatConversation.findFirst({
			where: {
				id: conversationId,
				userId,
			},
		});

		if (!conversation) {
			return NextResponse.json(
				{ error: "Conversation not found" },
				{ status: 404 }
			);
		}

		// Save user prompt as message with reference image if present
		const refImageMimeType = referenceImage?.mimeType || "image/jpeg";
		await prisma.chatMessage.create({
			data: {
				conversationId,
				role: "user",
				text: prompt,
				mediaType: "TEXT",
				...(referenceImage && {
					imageUrl: `data:${refImageMimeType};base64,${referenceImage.base64}`,
					mimeType: refImageMimeType,
				}),
			},
		});

		// Save "generating" status message for UI feedback
		const generatingMessage = await prisma.chatMessage.create({
			data: {
				conversationId,
				role: "model",
				text: "🎬 Generating video... This may take a few minutes.",
				mediaType: "TEXT",
			},
		});

		// Generate video
		const result = await generateVideo(prompt, {
			model: model as "fast" | "hq",
			aspectRatio: aspectRatio as "16:9" | "9:16",
			resolution: resolution as "720p" | "1080p",
			referenceImage,
			lastFrame,
		});

		// Delete the "generating" message
		await prisma.chatMessage.delete({
			where: { id: generatingMessage.id },
		});

		if (result.success && result.videoUri) {
			const aiMessageText = `🎥 Video generated successfully using Veo 3.1 ${
				model === "hq" ? "High Quality" : "Fast"
			}!`;

			// Save AI response with video
			const aiMessage = await prisma.chatMessage.create({
				data: {
					conversationId,
					role: "model",
					text: aiMessageText,
					mediaType: "VIDEO",
					videoUrl: result.videoUri,
					mimeType: "video/mp4",
					metadata: {
						model: `veo-3.1-${model}`,
						prompt,
						aspectRatio,
						resolution,
						hasReferenceImage: !!referenceImage,
						hasLastFrame: !!lastFrame,
					},
				},
			});

			return NextResponse.json({
				success: true,
				message: aiMessage,
				videoUrl: result.videoUri,
			});
		}

		// Handle failure - save error message
		const errorText =
			result?.error || "Video generation failed. Please try again.";

		const errorMessage = await prisma.chatMessage.create({
			data: {
				conversationId,
				role: "model",
				text: `❌ ${errorText}`,
				mediaType: "TEXT",
			},
		});

		return NextResponse.json(
			{
				error: errorText,
				message: errorMessage,
			},
			{ status: 500 }
		);
	} catch (error) {
		console.error("Video generation error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 }
		);
	}
}
