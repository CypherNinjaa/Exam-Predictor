import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI with the new SDK
const genAI = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY || "",
});

// POST /api/chat/conversations/[id]/messages - Send message and get AI response
export async function POST(
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
		const { message } = body;

		if (!message) {
			return NextResponse.json(
				{ error: "Message is required" },
				{ status: 400 }
			);
		}

		// Verify conversation ownership
		const conversation = await prisma.chatConversation.findFirst({
			where: {
				id,
				userId,
			},
			include: {
				user: {
					select: {
						name: true,
						email: true,
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

		// Save user message
		const userMessage = await prisma.chatMessage.create({
			data: {
				conversationId: id,
				role: "user",
				text: message,
			},
		});

		// Get user's academic context (subjects, topics)
		const userSubjects = await prisma.subject.findMany({
			where: {
				semester: {
					batch: {
						course: {
							college: {
								code: "AUP", // Amity University Patna
							},
						},
					},
				},
			},
			include: {
				syllabus: {
					include: {
						modules: {
							include: {
								topics: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				},
			},
			take: 5, // Limit to avoid token overflow
		});

		// Build context for AI
		const subjectsContext = userSubjects
			.map((subject) => {
				if (!subject.syllabus || !subject.syllabus.modules) {
					return `${subject.name} (${subject.code}): No syllabus available yet`;
				}
				const topics = subject.syllabus.modules
					.flatMap((m) => m.topics || [])
					.map((t) => t.name)
					.join(", ");
				return `${subject.name} (${subject.code}): ${
					topics || "No topics yet"
				}`;
			})
			.join("\n");

		// System prompt for exam preparation
		const systemPrompt = `You are AmityMate AI, an intelligent exam preparation assistant for Amity University Patna students. 

Your role is to:
- Help students understand complex concepts from their syllabus
- Generate practice questions and mock tests
- Provide study tips and strategies
- Explain topics in simple, easy-to-understand language
- Create study schedules and plans
- Answer questions about their subjects and exams

User Context:
Name: ${conversation.user.name || "Student"}
Email: ${conversation.user.email}

User's Subjects:
${subjectsContext || "No subjects enrolled yet"}

Guidelines:
- Be concise but thorough
- Use examples when explaining concepts
- Format answers with proper structure (headings, bullet points)
- When generating questions, follow standard exam patterns
- Always encourage and motivate the student
- If asked about topics not in their syllabus, still help but mention it's outside their current subjects

Keep responses focused on exam preparation and academic success.`;

		try {
			// Generate AI response using Gemini with new SDK
			const modelName =
				conversation.modelUsed === "advanced"
					? "gemini-2.5-pro"
					: "gemini-2.5-flash";

			// Build the prompt with system context and user message
			const prompt = `${systemPrompt}\n\nUser: ${message}\n\nAmityMate AI:`;

			const result = await genAI.models.generateContent({
				model: modelName,
				contents: prompt,
			});

			const aiResponse = result.text || "";

			// Save AI response
			const aiMessage = await prisma.chatMessage.create({
				data: {
					conversationId: id,
					role: "model",
					text: aiResponse,
				},
			});

			// Update conversation timestamp
			await prisma.chatConversation.update({
				where: { id },
				data: { updatedAt: new Date() },
			});

			// Log activity
			await prisma.activityLog.create({
				data: {
					userId,
					activityType: "CHAT_MESSAGE_SENT",
					description: `Sent message in conversation: ${conversation.title}`,
					metadata: {
						conversationId: id,
						messageLength: message.length,
					},
				},
			});

			return NextResponse.json({
				id: aiMessage.id,
				response: aiResponse,
				createdAt: aiMessage.createdAt,
			});
		} catch (aiError) {
			console.error("AI generation error:", aiError);

			// Save error message
			const errorMessage = await prisma.chatMessage.create({
				data: {
					conversationId: id,
					role: "model",
					text: "I apologize, but I'm having trouble generating a response right now. This could be due to API limits or configuration issues. Please try again later or contact support if the problem persists.",
				},
			});

			return NextResponse.json({
				id: errorMessage.id,
				response: errorMessage.text,
				createdAt: errorMessage.createdAt,
			});
		}
	} catch (error) {
		console.error("Failed to send message:", error);
		return NextResponse.json(
			{ error: "Failed to send message" },
			{ status: 500 }
		);
	}
}
