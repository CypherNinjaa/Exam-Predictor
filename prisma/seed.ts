/**
 * Database Seed Script
 * Seeds initial data for Amity University Patna
 *
 * Run: npm run db:seed
 */

import { PrismaClient, BookType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Starting database seed...\n");

	// 1. Create College
	const college = await prisma.college.upsert({
		where: { code: "AUP" },
		update: {},
		create: {
			name: "Amity University Patna",
			code: "AUP",
			location: "Patna, Bihar, India",
		},
	});
	console.log(`✅ College: ${college.name}`);

	// 2. Create Courses
	const bca = await prisma.course.upsert({
		where: {
			collegeId_code: {
				collegeId: college.id,
				code: "BCA",
			},
		},
		update: {},
		create: {
			name: "Bachelor of Computer Applications",
			code: "BCA",
			duration: 3,
			collegeId: college.id,
			description: "3-year undergraduate program in Computer Applications",
		},
	});

	const btech = await prisma.course.upsert({
		where: {
			collegeId_code: {
				collegeId: college.id,
				code: "BTECH-CSE",
			},
		},
		update: {},
		create: {
			name: "Bachelor of Technology - Computer Science",
			code: "BTECH-CSE",
			duration: 4,
			collegeId: college.id,
			description: "4-year undergraduate program in Computer Science",
		},
	});
	console.log(`✅ Courses: BCA (3yr), BTech CSE (4yr)`);

	// 3. Create Batch for BCA 2024-2027
	const bcaBatch = await prisma.batch.upsert({
		where: {
			courseId_startYear: {
				courseId: bca.id,
				startYear: 2024,
			},
		},
		update: {},
		create: {
			startYear: 2024,
			endYear: 2027,
			courseId: bca.id,
			isActive: true,
		},
	});
	console.log(`✅ Batch: BCA 2024-2027`);

	// 4. Create 6 Semesters for BCA (3 years x 2 semesters)
	const semesters = [];
	for (let sem = 1; sem <= 6; sem++) {
		const semester = await prisma.semester.upsert({
			where: {
				batchId_number: {
					batchId: bcaBatch.id,
					number: sem,
				},
			},
			update: {},
			create: {
				number: sem,
				batchId: bcaBatch.id,
			},
		});
		semesters.push(semester);
	}
	console.log(`✅ Semesters: 1-6 for BCA 2024-2027`);

	// 5. Create Sample Subjects for Semester 5
	const sem5 = semesters[4]; // 0-indexed, so index 4 = semester 5

	const subjects = [
		{ code: "BCA501", name: "Web Development Technology", credits: 4 },
		{ code: "BCA502", name: "Computer Networks", credits: 4 },
		{ code: "BCA503", name: "Software Engineering", credits: 3 },
		{ code: "BCA504", name: "Python Programming", credits: 4 },
	];

	for (const subj of subjects) {
		await prisma.subject.upsert({
			where: {
				semesterId_code: {
					semesterId: sem5.id,
					code: subj.code,
				},
			},
			update: {},
			create: {
				...subj,
				semesterId: sem5.id,
			},
		});
	}
	console.log(`✅ Subjects: ${subjects.length} subjects for Semester 5`);

	// 6. Create Syllabus for Web Development
	const webDev = await prisma.subject.findFirst({
		where: { code: "BCA501", semesterId: sem5.id },
	});

	if (webDev) {
		const syllabus = await prisma.syllabus.upsert({
			where: { subjectId: webDev.id },
			update: {},
			create: {
				subjectId: webDev.id,
				version: "1.0",
				description: "Web Development Technology - HTML, CSS, JavaScript, XML",
				totalHours: 30,
			},
		});

		// Create Modules
		const modules = [
			{
				number: 1,
				name: "Basics of HTML",
				hours: 6,
				topics: [
					"Introduction to HTML: syntax, elements, document structure",
					"Text formatting: paragraphs, headings, and inline elements",
					"HTML lists: ordered, unordered, and definition lists",
					"Hyperlinks and Embedding multimedia",
					"HTML forms: input types, validation",
				],
			},
			{
				number: 2,
				name: "Styling with CSS",
				hours: 8,
				topics: [
					"Introduction to CSS: syntax and selectors",
					"Box model: margin, padding, border",
					"CSS layouts: flexbox and grid",
					"Responsive design basics",
				],
			},
			{
				number: 3,
				name: "JavaScript Fundamentals",
				hours: 8,
				topics: [
					"Variables, data types, operators",
					"Functions and scope",
					"DOM manipulation",
					"Event handling",
				],
			},
			{
				number: 4,
				name: "Introduction to XML",
				hours: 4,
				topics: [
					"XML syntax and structure",
					"DTD and XML Schema",
					"XPath and XSLT",
				],
			},
		];

		for (const mod of modules) {
			const module = await prisma.module.upsert({
				where: {
					syllabusId_number: {
						syllabusId: syllabus.id,
						number: mod.number,
					},
				},
				update: {},
				create: {
					number: mod.number,
					name: mod.name,
					hours: mod.hours,
					syllabusId: syllabus.id,
				},
			});

			// Create Topics
			for (let i = 0; i < mod.topics.length; i++) {
				await prisma.topic.create({
					data: {
						name: mod.topics[i],
						moduleId: module.id,
						orderIndex: i + 1,
						freshnessScore: Math.random() * 0.5 + 0.3,
					},
				});
			}
		}

		console.log(`✅ Syllabus: BCA501 with ${modules.length} modules`);
	}

	console.log("\n🎉 Database seeded successfully!");
	console.log("\n📊 Summary:");
	console.log(`   - College: Amity University Patna`);
	console.log(`   - Courses: BCA, BTech CSE`);
	console.log(`   - Batch: BCA 2024-2027 with 6 semesters`);
	console.log(`   - Sample subjects in Semester 5`);
}

main()
	.catch((e) => {
		console.error("❌ Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
