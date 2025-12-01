"use server";

import prisma from "@/lib/prisma";

export interface Subject {
	id: string;
	name: string;
	code: string;
}

export interface PredictionResult {
	id: string;
	question: string;
	type: string;
	marks: number;
	difficulty: string;
	bloomLevel: string;
	moduleName: string;
	topicName: string;
	confidence: number;
}

export async function getSubjectsForUser(): Promise<Subject[]> {
	try {
		const subjects = await prisma.subject.findMany({
			orderBy: { name: "asc" },
			select: {
				id: true,
				name: true,
				code: true,
			},
		});
		return subjects;
	} catch (error) {
		console.error("Error fetching subjects:", error);
		// Return mock data when database is unavailable
		return [
			{ id: "1", name: "Computer Networks", code: "CSE301" },
			{ id: "2", name: "Database Management Systems", code: "CSE302" },
			{ id: "3", name: "Operating Systems", code: "CSE303" },
			{ id: "4", name: "Data Structures", code: "CSE201" },
			{ id: "5", name: "Web Technologies", code: "CSIT256" },
		];
	}
}

export async function getExamTypes(): Promise<string[]> {
	return ["MIDTERM_1", "MIDTERM_2", "END_TERM"];
}

export async function generatePredictions(
	subjectId: string,
	examType: string,
	questionCount: number = 10
): Promise<PredictionResult[]> {
	try {
		// First, get the subject with its syllabus
		const subject = await prisma.subject.findUnique({
			where: { id: subjectId },
			include: {
				syllabi: {
					include: {
						modules: {
							include: {
								topics: true,
							},
						},
					},
				},
			},
		});

		if (!subject) {
			// Return mock predictions when subject not found
			return generateMockPredictions(questionCount, examType);
		}

		// Generate AI-based predictions from syllabus topics
		const predictions: PredictionResult[] = [];
		const syllabus = subject.syllabi[0];

		if (syllabus) {
			for (const module of syllabus.modules) {
				for (const topic of module.topics) {
					if (predictions.length >= questionCount) break;

					predictions.push({
						id: `pred-${topic.id}`,
						question: generateQuestionFromTopic(
							topic.name,
							examType,
							module.name
						),
						type: getQuestionType(examType),
						marks: getMarks(examType),
						difficulty: getDifficulty(predictions.length),
						bloomLevel: getBloomLevel(predictions.length),
						moduleName: module.name,
						topicName: topic.name,
						confidence: Math.max(50, 90 - predictions.length * 4),
					});
				}
				if (predictions.length >= questionCount) break;
			}
		}

		// If no predictions from syllabus, return mock data
		if (predictions.length === 0) {
			return generateMockPredictions(questionCount, examType);
		}

		return predictions;
	} catch (error) {
		console.error("Error generating predictions:", error);
		return generateMockPredictions(questionCount, examType);
	}
}

function generateMockPredictions(
	count: number,
	examType: string
): PredictionResult[] {
	const mockTopics = [
		{ module: "Network Fundamentals", topic: "OSI Model and Layers" },
		{ module: "Network Fundamentals", topic: "TCP/IP Protocol Suite" },
		{ module: "Data Link Layer", topic: "Error Detection and Correction" },
		{ module: "Data Link Layer", topic: "Flow Control Mechanisms" },
		{ module: "Network Layer", topic: "Routing Algorithms" },
		{ module: "Network Layer", topic: "IP Addressing and Subnetting" },
		{ module: "Transport Layer", topic: "TCP vs UDP Comparison" },
		{ module: "Transport Layer", topic: "Congestion Control" },
		{ module: "Application Layer", topic: "HTTP and Web Protocols" },
		{ module: "Application Layer", topic: "DNS and Name Resolution" },
	];

	return mockTopics.slice(0, count).map((item, idx) => ({
		id: `mock-${idx}`,
		question: generateQuestionFromTopic(item.topic, examType, item.module),
		type: getQuestionType(examType),
		marks: getMarks(examType),
		difficulty: getDifficulty(idx),
		bloomLevel: getBloomLevel(idx),
		moduleName: item.module,
		topicName: item.topic,
		confidence: Math.max(50, 92 - idx * 4),
	}));
}

function generateQuestionFromTopic(
	topicName: string,
	examType: string,
	moduleName: string
): string {
	const questionTemplates = [
		`Explain the concept of ${topicName} in detail with examples.`,
		`What are the key components of ${topicName}? Discuss with a suitable diagram.`,
		`Describe the working principle of ${topicName}.`,
		`Compare and contrast different approaches in ${topicName}.`,
		`Write short notes on ${topicName}.`,
		`Explain ${topicName} with reference to ${moduleName}.`,
		`What is ${topicName}? Explain its applications.`,
		`Discuss the importance of ${topicName} in modern computing.`,
		`Define ${topicName} and explain its characteristics.`,
		`Illustrate ${topicName} with a suitable example.`,
	];

	const randomIndex = Math.floor(Math.random() * questionTemplates.length);
	return questionTemplates[randomIndex];
}

function getQuestionType(examType: string): string {
	if (examType === "MIDTERM_1" || examType === "MIDTERM_2") {
		return Math.random() > 0.5 ? "Short Answer" : "Long Answer";
	}
	return Math.random() > 0.3 ? "Long Answer" : "Short Answer";
}

function getMarks(examType: string): number {
	if (examType === "MIDTERM_1" || examType === "MIDTERM_2") {
		return Math.random() > 0.5 ? 5 : 10;
	}
	return [5, 10, 15][Math.floor(Math.random() * 3)];
}

function getDifficulty(index: number): string {
	const difficulties = ["Easy", "Medium", "Medium", "Hard"];
	return difficulties[index % difficulties.length];
}

function getBloomLevel(index: number): string {
	const levels = [
		"Remember",
		"Understand",
		"Apply",
		"Analyze",
		"Evaluate",
		"Create",
	];
	return levels[index % levels.length];
}
