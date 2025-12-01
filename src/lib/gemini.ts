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
 * Model names - Available Gemini models (Dec 2025)
 *
 * PRODUCTION MODELS (Recommended):
 * - gemini-2.5-flash: Best price-performance, document processing, FREE tier friendly
 * - gemini-2.5-pro: Advanced reasoning, complex tasks, thinking mode support
 * - gemini-2.0-flash: Fast workhorse, 1M token context
 * - gemini-2.0-flash-lite: Fastest, most cost-efficient
 *
 * PREVIEW MODELS (Use with caution):
 * - gemini-3-pro-preview: NEW Reasoning & Agentic model (Released Nov 18, 2025)
 *   ⚠️ WARNINGS:
 *   - FREE TIER LIMIT: ~30-50 prompts/day (overwhelming demand)
 *   - MORE EXPENSIVE on paid tiers
 *   - In "Public Preview" - may be less stable
 *   - Best for: Agentic coding, complex reasoning, vibe coding
 *   - NOT recommended for production apps with many users
 */
export const MODELS = {
	// Primary model for document extraction and vision tasks
	DOCUMENT: "gemini-2.5-flash",
	// Fast model for quick tasks
	FAST: "gemini-2.0-flash",
	// Advanced reasoning model - RECOMMENDED for predictions (stable & cost-effective)
	PRO: "gemini-2.5-pro",
	// Gemini 3.0 Preview - Cutting edge but LIMITED (use for testing only)
	GEMINI_3_PREVIEW: "gemini-3-pro-preview",
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
	// Advanced reasoning with thinking budget for complex predictions
	reasoning: {
		modelName: MODELS.PRO,
		temperature: 0.3,
		maxTokens: 16384,
		// Thinking budget for Gemini 2.5 Pro (max: 32768)
		thinkingBudget: 24576,
	},
	// Gemini 3.0 Preview config (experimental - use sparingly)
	gemini3Preview: {
		modelName: MODELS.GEMINI_3_PREVIEW,
		temperature: 0.3,
		maxTokens: 16384,
		// Note: Gemini 3 may have different thinking budget limits
	},
};

/**
 * Get the prediction model based on environment variable
 * Defaults to Gemini 2.5 Pro (stable) unless ENABLE_GEMINI_3 is set
 */
export function getPredictionModel(): string {
	const useGemini3 = process.env.ENABLE_GEMINI_3 === "true";

	if (useGemini3) {
		console.warn(
			"⚠️ Using Gemini 3.0 Preview - Limited to ~30-50 requests/day on free tier"
		);
		return MODELS.GEMINI_3_PREVIEW;
	}

	return MODELS.PRO; // Default: Stable and production-ready
}

/**
 * Generate content with advanced thinking capabilities
 * Uses Gemini 2.5 Pro's thinking mode for complex reasoning tasks
 * Can optionally use Gemini 3.0 Preview if enabled via env var or parameter
 */
export async function generateWithThinking(
	contents: string,
	thinkingBudget: number = 24576,
	useGemini3: boolean = false,
	modelOverride?: string // NEW: Allow explicit model selection
) {
	// Determine which model to use
	let modelToUse: string;

	if (modelOverride) {
		// Use explicitly provided model
		modelToUse = modelOverride;
	} else {
		// Check environment variable if useGemini3 param is not explicitly set
		const envGemini3 = process.env.ENABLE_GEMINI_3 === "true";
		const shouldUseGemini3 = useGemini3 || envGemini3;
		modelToUse = shouldUseGemini3 ? MODELS.GEMINI_3_PREVIEW : MODELS.PRO;
	}

	if (modelToUse === MODELS.GEMINI_3_PREVIEW) {
		console.warn(
			"⚠️ Using Gemini 3.0 Preview - Limited to ~30-50 requests/day on free tier"
		);
	}

	console.log(`Generating with model: ${modelToUse}`);
	console.log(`Thinking budget: ${thinkingBudget}`);

	const response = await client.models.generateContent({
		model: modelToUse,
		contents: contents,
		config: {
			thinkingConfig: {
				thinkingBudget: Math.min(thinkingBudget, 32768), // Max for Pro models
			},
		},
	});

	return response;
}

export { client as genAI };
