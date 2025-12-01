import { createHash } from "crypto";
import { prisma } from "./prisma";

export interface DuplicateCheckResult {
	isDuplicate: boolean;
	duplicateType?: "exact_file" | "same_subject" | "similar_content";
	existingSyllabus?: {
		id: string;
		subjectId: string;
		subjectName: string;
		subjectCode: string;
		version: string;
		uploadedAt: Date;
		modulesCount: number;
	};
	message: string;
}

/**
 * Generate MD5 hash of a file buffer for duplicate detection
 */
export function generateFileHash(buffer: Buffer): string {
	return createHash("md5").update(buffer).digest("hex");
}

/**
 * Check if a syllabus upload is a duplicate
 * Returns information about the duplicate if found
 */
export async function checkSyllabusDuplicate(
	subjectId: string,
	fileBuffer: Buffer
): Promise<DuplicateCheckResult> {
	const fileHash = generateFileHash(fileBuffer);

	// Check 1: Exact file match (same hash) across ALL syllabi
	const exactMatch = await prisma.syllabus.findFirst({
		where: { fileHash },
		include: {
			subject: {
				select: { name: true, code: true },
			},
			modules: {
				select: { id: true },
			},
		},
	});

	if (exactMatch) {
		return {
			isDuplicate: true,
			duplicateType: "exact_file",
			existingSyllabus: {
				id: exactMatch.id,
				subjectId: exactMatch.subjectId,
				subjectName: exactMatch.subject.name,
				subjectCode: exactMatch.subject.code,
				version: exactMatch.version,
				uploadedAt: exactMatch.createdAt,
				modulesCount: exactMatch.modules.length,
			},
			message: `This exact PDF file has already been uploaded for ${exactMatch.subject.name} (${exactMatch.subject.code}).`,
		};
	}

	// Check 2: Same subject already has a syllabus
	const existingSyllabus = await prisma.syllabus.findUnique({
		where: { subjectId },
		include: {
			subject: {
				select: { name: true, code: true },
			},
			modules: {
				select: { id: true },
			},
		},
	});

	if (existingSyllabus && existingSyllabus.modules.length > 0) {
		return {
			isDuplicate: true,
			duplicateType: "same_subject",
			existingSyllabus: {
				id: existingSyllabus.id,
				subjectId: existingSyllabus.subjectId,
				subjectName: existingSyllabus.subject.name,
				subjectCode: existingSyllabus.subject.code,
				version: existingSyllabus.version,
				uploadedAt: existingSyllabus.createdAt,
				modulesCount: existingSyllabus.modules.length,
			},
			message: `A syllabus already exists for ${existingSyllabus.subject.name} (${existingSyllabus.subject.code}) with ${existingSyllabus.modules.length} modules. Do you want to replace it?`,
		};
	}

	// No duplicate found
	return {
		isDuplicate: false,
		message: "No duplicate found. Syllabus can be uploaded.",
	};
}

/**
 * Check if extracted content is similar to existing syllabus
 * Uses subject code from extracted data
 */
export async function checkContentSimilarity(
	extractedSubjectCode: string | undefined,
	targetSubjectId: string
): Promise<DuplicateCheckResult | null> {
	if (!extractedSubjectCode) return null;

	// Find if any other subject has this code
	const matchingSubject = await prisma.subject.findFirst({
		where: {
			code: extractedSubjectCode,
			id: { not: targetSubjectId },
		},
		include: {
			syllabus: {
				include: {
					modules: { select: { id: true } },
				},
			},
		},
	});

	if (matchingSubject?.syllabus) {
		return {
			isDuplicate: true,
			duplicateType: "similar_content",
			existingSyllabus: {
				id: matchingSubject.syllabus.id,
				subjectId: matchingSubject.id,
				subjectName: matchingSubject.name,
				subjectCode: matchingSubject.code,
				version: matchingSubject.syllabus.version,
				uploadedAt: matchingSubject.syllabus.createdAt,
				modulesCount: matchingSubject.syllabus.modules.length,
			},
			message: `The uploaded syllabus appears to be for ${matchingSubject.name} (${matchingSubject.code}), but you're uploading to a different subject.`,
		};
	}

	return null;
}
