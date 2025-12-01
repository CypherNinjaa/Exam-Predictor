import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
 * Gemini 1.5 Flash - For fast, simple tasks
 * - Metadata tagging
 * - Keyword extraction
 * - Quick classification
 */
export const geminiFlash = genAI.getGenerativeModel({
	model: "gemini-1.5-flash",
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
		model: geminiPro,
		temperature: 0.7, // Higher for creativity
		maxTokens: 4096,
	},
};

export { genAI };
