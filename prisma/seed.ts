/**
 * Database Seed Script
 * Seeds initial data for Amity University Patna
 *
 * Run: npm run db:seed
 */

import { PrismaClient, ExamType, BookType } from "@prisma/client";

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

	// 2. Create Academic Years
	const years = [2020, 2021, 2022, 2023, 2024, 2025];
	for (const year of years) {
		await prisma.academicYear.upsert({
			where: {
				collegeId_year: {
					collegeId: college.id,
					year,
				},
			},
			update: {},
			create: {
				year,
				collegeId: college.id,
			},
		});
	}
	console.log(`✅ Academic Years: ${years.join(", ")}`);

	// 3. Create Sample Subjects (CSE)
	const subjects = [
		{ code: "CSIT256", name: "Web Development Technology", credits: 4 },
		{ code: "CSE301", name: "Computer Networks", credits: 4 },
		{ code: "CSE302", name: "Database Management Systems", credits: 4 },
		{ code: "CSE303", name: "Operating Systems", credits: 4 },
		{ code: "CSE304", name: "Software Engineering", credits: 3 },
		{ code: "CSE305", name: "Data Structures & Algorithms", credits: 4 },
		{ code: "CSE401", name: "Machine Learning", credits: 4 },
		{ code: "CSE402", name: "Artificial Intelligence", credits: 4 },
		{ code: "CSE403", name: "Cloud Computing", credits: 3 },
		{ code: "CSE404", name: "Cyber Security", credits: 3 },
	];

	for (const subj of subjects) {
		await prisma.subject.upsert({
			where: {
				collegeId_code: {
					collegeId: college.id,
					code: subj.code,
				},
			},
			update: {},
			create: {
				...subj,
				collegeId: college.id,
			},
		});
	}
	console.log(`✅ Subjects: ${subjects.length} subjects created`);

	// 4. Create Semesters for 2024
	const year2024 = await prisma.academicYear.findFirst({
		where: { collegeId: college.id, year: 2024 },
	});

	if (year2024) {
		for (let sem = 1; sem <= 8; sem++) {
			await prisma.semester.upsert({
				where: {
					academicYearId_number: {
						academicYearId: year2024.id,
						number: sem,
					},
				},
				update: {},
				create: {
					number: sem,
					academicYearId: year2024.id,
				},
			});
		}
		console.log(`✅ Semesters: 1-8 for 2024`);
	}

	// 5. Create Sample Syllabus for CSE301 (Computer Networks)
	const cse301 = await prisma.subject.findFirst({
		where: { code: "CSE301", collegeId: college.id },
	});

	if (cse301) {
		const syllabus = await prisma.syllabus.upsert({
			where: {
				subjectId_year: {
					subjectId: cse301.id,
					year: 2024,
				},
			},
			update: {},
			create: {
				subjectId: cse301.id,
				year: 2024,
				version: "1.0",
				description: "Computer Networks syllabus for BTech CSE Semester 5",
			},
		});

		// Create Modules
		const modules = [
			{
				number: 1,
				name: "Network Fundamentals",
				weightage: 20,
				topics: [
					"OSI Model",
					"TCP/IP Model",
					"Network Topologies",
					"Transmission Media",
				],
			},
			{
				number: 2,
				name: "Data Link Layer",
				weightage: 20,
				topics: [
					"Framing",
					"Error Detection",
					"Flow Control",
					"MAC Protocols",
					"CSMA/CD",
				],
			},
			{
				number: 3,
				name: "Network Layer",
				weightage: 25,
				topics: [
					"IP Addressing",
					"Subnetting",
					"Routing Algorithms",
					"OSPF",
					"BGP",
				],
			},
			{
				number: 4,
				name: "Transport Layer",
				weightage: 20,
				topics: ["TCP", "UDP", "Congestion Control", "Flow Control"],
			},
			{
				number: 5,
				name: "Application Layer",
				weightage: 15,
				topics: ["HTTP", "DNS", "SMTP", "FTP", "Network Security Basics"],
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
					weightage: mod.weightage,
					syllabusId: syllabus.id,
				},
			});

			// Create Topics for each module
			for (const topicName of mod.topics) {
				await prisma.topic.upsert({
					where: {
						id: `${module.id}-${topicName.replace(/\s/g, "-").toLowerCase()}`,
					},
					update: {},
					create: {
						name: topicName,
						moduleId: module.id,
						freshnessScore: 0.5,
					},
				});
			}
		}
		console.log(`✅ Syllabus: CSE301 with ${modules.length} modules`);
	}

	// 6. Create Syllabus for CSIT256 (Web Development Technology)
	const csit256 = await prisma.subject.findFirst({
		where: { code: "CSIT256", collegeId: college.id },
	});

	if (csit256) {
		const webSyllabus = await prisma.syllabus.upsert({
			where: {
				subjectId_year: {
					subjectId: csit256.id,
					year: 2024,
				},
			},
			update: {},
			create: {
				subjectId: csit256.id,
				year: 2024,
				semester: 5,
				version: "1.0",
				description: "Web Development Technology - HTML, CSS, JavaScript, XML",
				totalHours: 30,
			},
		});

		// Create Modules for Web Dev
		const webModules = [
			{
				number: 1,
				name: "Basics of HTML",
				hours: 6,
				topics: [
					"Introduction to HTML: syntax, elements, document structure",
					"Text formatting: paragraphs, headings, and inline elements",
					"HTML lists: ordered, unordered, and definition lists",
					"Hyperlinks: internal and external links, anchor attributes",
					"Embedding multimedia: images, audio, video elements",
					"HTML forms: input types, form attributes, action, and method",
					"Form validation and submission handling",
				],
			},
			{
				number: 2,
				name: "Styling with CSS",
				hours: 8,
				topics: [
					"Introduction to CSS: syntax and selectors",
					"Applying styles: inline, internal, and external stylesheets",
					"Typography: font properties, color, and text alignment",
					"Box model: margin, padding, border, width, height",
					"Background properties: color, image, repeat, position",
					"CSS layouts: float, flexbox basics, and CSS grid fundamentals",
					"Pseudo-classes and pseudo-elements",
				],
			},
			{
				number: 3,
				name: "JavaScript Fundamentals",
				hours: 8,
				topics: [
					"Introduction to JavaScript: syntax and structure",
					"Variables and data types: var, let, const",
					"Operators: arithmetic, assignment, comparison, logical",
					"Conditional statements: if-else, switch, ternary",
					"Loops and iteration: for, while, do-while",
					"Functions: declarations, expressions, parameters",
					"Closures and Scope",
				],
			},
			{
				number: 4,
				name: "DOM Manipulation",
				hours: 4,
				topics: [
					"Introduction to the Document Object Model (DOM)",
					"DOM traversal: parent, children, sibling nodes",
					"Creating, inserting, and removing elements dynamically",
					"Event handling: types of events and event listeners",
					"Event propagation: bubbling and capturing",
				],
			},
			{
				number: 5,
				name: "Introduction to XML",
				hours: 4,
				topics: [
					"Overview of XML and its uses",
					"Document Type Definitions (DTD)",
					"XPath expressions and navigation",
					"XSLT: transforming XML documents",
				],
			},
		];

		for (const mod of webModules) {
			const module = await prisma.module.upsert({
				where: {
					syllabusId_number: {
						syllabusId: webSyllabus.id,
						number: mod.number,
					},
				},
				update: {},
				create: {
					number: mod.number,
					name: mod.name,
					hours: mod.hours,
					syllabusId: webSyllabus.id,
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

		// Create Books for Web Dev
		const textbooks = [
			{
				title: "Mastering HTML, CSS & JavaScript",
				author: "Laura Lemay",
				publisher: "BPB Publications",
				year: 2016,
			},
			{
				title: "HTML, XHTML, and CSS",
				author: "Elizabeth Castro",
				publisher: "Peachpit Press",
				year: 2014,
			},
			{
				title: "Web Design with HTML, CSS, JavaScript",
				author: "Jon Duckett",
				publisher: "Wiley",
				year: 2011,
			},
			{
				title: "The Modern JavaScript Tutorial",
				author: "Ilya Kantor",
				publisher: "Online",
				year: 2023,
			},
			{
				title: "Eloquent JavaScript",
				author: "Marijn Haverbeke",
				publisher: "No Starch Press",
				year: 2018,
			},
			{
				title: "JavaScript: The Good Parts",
				author: "Douglas Crockford",
				publisher: "O'Reilly Media",
				year: 2008,
			},
		];

		for (const book of textbooks) {
			await prisma.book.create({
				data: {
					...book,
					bookType: BookType.TEXTBOOK,
					syllabusId: webSyllabus.id,
				},
			});
		}

		const references = [
			{
				title: "MDN Web Docs",
				author: "Mozilla Foundation",
				publisher: "Online Documentation",
				year: 2024,
			},
			{
				title: "W3Schools Tutorials",
				author: "W3Schools",
				publisher: "Online Resource",
				year: 2024,
			},
		];

		for (const ref of references) {
			await prisma.book.create({
				data: {
					...ref,
					bookType: BookType.REFERENCE,
					syllabusId: webSyllabus.id,
				},
			});
		}

		// Create Evaluation Scheme
		await prisma.evaluationScheme.upsert({
			where: { syllabusId: webSyllabus.id },
			update: {},
			create: {
				syllabusId: webSyllabus.id,
				midterm1: 15,
				midterm2: 15,
				endterm: 60,
				assignments: 5,
				practicals: 5,
			},
		});

		console.log(
			`✅ Syllabus: CSIT256 with ${webModules.length} modules, books, and evaluation scheme`
		);
	}

	console.log("\n🎉 Database seeded successfully!");
	console.log("\n📊 Summary:");
	console.log(`   - College: 1`);
	console.log(`   - Academic Years: ${years.length}`);
	console.log(`   - Subjects: ${subjects.length}`);
	console.log(`   - Semesters: 8`);
	console.log(`   - Syllabi: CSE301, CSIT256 with full module/topic structure`);
}

main()
	.catch((e) => {
		console.error("❌ Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
