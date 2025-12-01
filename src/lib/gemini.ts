import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Main Gemini instance for getting models
 */
export const gemini = genAI;

/**
 * Gemini 2.0 Flash - Default model for most tasks
 */
export const geminiFlash = genAI.getGenerativeModel({
	model: "gemini-2.0-flash",
});

/**
 * Gemini 1.5 Pro - For complex tasks
 * - OCR/Vision extraction
 * - Complex reasoning
 * - Pattern analysis
 */
export const geminiPro = genAI.getGenerativeModel({
	model: "gemini-1.5-pro",
});

/**
 * Configuration for different use cases
 */
export const modelConfigs = {
	extraction: {
		model: geminiPro,
		temperature: 0.1, // Low for accuracy
		maxTokens: 8192,
	},
	tagging: {
		model: geminiFlash,
		temperature: 0.2,
		maxTokens: 2048,
	},
	generation: {
		model: geminiFlash,
		temperature: 0.7, // Higher for creativity
		maxTokens: 4096,
	},
};

export { genAI };
