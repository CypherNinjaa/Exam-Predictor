import { GoogleGenAI } from "@google/genai";

// Initialize the new Google GenAI client
// It automatically reads GEMINI_API_KEY or GOOGLE_API_KEY from env
const client = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY!,
});

/**
 * Main Gemini client instance
 */
export const gemini = client;

/**
 * Model names - Use stable model names (Dec 2025)
 * Available models:
 * - gemini-2.5-flash (best price-performance, good for document processing)
 * - gemini-2.0-flash (workhorse model, 1M token context)
 * - gemini-2.5-pro (advanced reasoning, complex tasks)
 * - gemini-2.0-flash-lite (fastest, cost-efficient)
 */
export const MODELS = {
	// Primary model for document extraction and vision tasks
	DOCUMENT: "gemini-2.5-flash",
	// Fast model for quick tasks
	FAST: "gemini-2.0-flash",
	// Advanced reasoning model
	PRO: "gemini-2.5-pro",
	// Fallback models if primary fails
	FALLBACKS: ["gemini-2.0-flash", "gemini-2.0-flash-lite"] as const,
} as const;

/**
 * Generate content using the new SDK with automatic fallback
 */
export async function generateWithFallback(
	contents:
		| string
		| Array<{ inlineData?: { mimeType: string; data: string }; text?: string }>,
	primaryModel: string = MODELS.DOCUMENT
) {
	const modelsToTry = [
		primaryModel,
		...MODELS.FALLBACKS.filter((m) => m !== primaryModel),
	];

	let lastError: Error | null = null;

	for (const modelName of modelsToTry) {
		try {
			console.log(`Trying model: ${modelName}`);

			const response = await client.models.generateContent({
				model: modelName,
				contents: contents,
			});

			return response;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			console.warn(
				`Model ${modelName} failed, trying next...`,
				lastError.message
			);
			continue;
		}
	}

	throw new Error(
		`All models failed. Last error: ${lastError?.message || "Unknown error"}`
	);
}

/**
 * Generate content with a specific model (no fallback)
 */
export async function generateContent(
	contents:
		| string
		| Array<{ inlineData?: { mimeType: string; data: string }; text?: string }>,
	model: string = MODELS.FAST
) {
	return await client.models.generateContent({
		model,
		contents,
	});
}

/**
 * Configuration for different use cases
 */
export const modelConfigs = {
	extraction: {
		modelName: MODELS.DOCUMENT,
		temperature: 0.1, // Low for accuracy
		maxTokens: 8192,
	},
	tagging: {
		modelName: MODELS.FAST,
		temperature: 0.2,
		maxTokens: 2048,
	},
	generation: {
		modelName: MODELS.FAST,
		temperature: 0.7, // Higher for creativity
		maxTokens: 4096,
	},
};

export { client as genAI };
