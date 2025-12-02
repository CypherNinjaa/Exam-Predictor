import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { generateImage, generateImageNanoBanana } from "@/lib/gemini";

/**
 * POST /api/chat/generate-image
 * Generate images using Imagen 4.0 or Nano Banana
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
			model = "imagen", // "imagen" or "nano"
			aspectRatio = "1:1",
			editImage, // Optional: base64 image for editing (nano only)
			mimeType = "image/jpeg",
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
		await prisma.chatMessage.create({
			data: {
				conversationId,
				role: "user",
				text: prompt,
				mediaType: "TEXT",
				...(editImage && {
					imageUrl: `data:${mimeType};base64,${editImage}`,
					mimeType,
				}),
			},
		});

		let result;
		let aiMessageText = "";

		// Generate image based on model choice
		if (model === "nano") {
			// Nano Banana - general/editing
			result = await generateImageNanoBanana(prompt, {
				editImage,
				mimeType,
			});

			if (result.success && result.image) {
				aiMessageText = editImage
					? `✨ Image edited successfully using Nano Banana!`
					: `🎨 Image generated successfully using Nano Banana!`;

				// Save AI response with image
				const aiMessage = await prisma.chatMessage.create({
					data: {
						conversationId,
						role: "model",
						text: aiMessageText,
						mediaType: "IMAGE",
						imageUrl: result.image.dataUrl,
						mimeType: result.image.mimeType,
						metadata: {
							model: "nano-banana",
							prompt,
							editMode: !!editImage,
						},
					},
				});

				return NextResponse.json({
					success: true,
					message: aiMessage,
					image: result.image,
				});
			}
		} else {
			// Imagen 4.0 - high quality
			result = await generateImage(prompt, {
				aspectRatio: aspectRatio as any,
				outputMimeType: mimeType as any,
				numberOfImages: 1,
			});

			if (result.success && result.images && result.images.length > 0) {
				const image = result.images[0];
				aiMessageText = `🎨 High-quality image generated successfully using Imagen 4.0!`;

				// Save AI response with image
				const aiMessage = await prisma.chatMessage.create({
					data: {
						conversationId,
						role: "model",
						text: aiMessageText,
						mediaType: "IMAGE",
						imageUrl: image.dataUrl,
						mimeType: image.mimeType,
						metadata: {
							model: "imagen-4.0",
							prompt,
							aspectRatio,
						},
					},
				});

				return NextResponse.json({
					success: true,
					message: aiMessage,
					image,
				});
			}
		}

		// Handle failure
		return NextResponse.json(
			{
				error: result?.error || "Image generation failed",
			},
			{ status: 500 }
		);
	} catch (error) {
		console.error("Image generation error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 }
		);
	}
}
