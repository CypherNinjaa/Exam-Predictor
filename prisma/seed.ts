/**
 * Database Seed Script
 * Seeds initial data for Amity University Patna
 *
 * Run: npm run db:seed
 */

import { PrismaClient, ExamType } from "@prisma/client";

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
	const years = [2022, 2023, 2024, 2025];
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
		{ code: "CSE301", name: "Computer Networks", credits: 4 },
		{ code: "CSE302", name: "Database Management Systems", credits: 4 },
		{ code: "CSE303", name: "Operating Systems", credits: 4 },
		{ code: "CSE304", name: "Software Engineering", credits: 3 },
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

	console.log("\n🎉 Database seeded successfully!");
	console.log("\n📊 Summary:");
	console.log(`   - College: 1`);
	console.log(`   - Academic Years: ${years.length}`);
	console.log(`   - Subjects: ${subjects.length}`);
	console.log(`   - Semesters: 8`);
	console.log(`   - Modules: 5 (for CSE301)`);
}

main()
	.catch((e) => {
		console.error("❌ Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
