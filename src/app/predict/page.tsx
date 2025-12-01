"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";

interface Subject {
	id: string;
	code: string;
	name: string;
}

interface PredictedQuestion {
	id: string;
	text: string;
	probability: number;
	module: string;
	topic: string;
	difficulty: string;
	marks: number;
	reasoning: string[];
}

export default function PredictPage() {
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [loading, setLoading] = useState(false);
	const [predictions, setPredictions] = useState<PredictedQuestion[]>([]);
	const [config, setConfig] = useState({
		subjectId: "",
		examType: "END_TERM",
		questionCount: 10,
	});

	useEffect(() => {
		fetch("/api/subjects")
			.then((r) => r.json())
			.then((data) => setSubjects(data.subjects || []))
			.catch(console.error);
	}, []);

	const generatePredictions = async () => {
		if (!config.subjectId) return;

		setLoading(true);
		setPredictions([]);

		try {
			const response = await fetch("/api/predict", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(config),
			});

			const data = await response.json();
			setPredictions(data.predictions || []);
		} catch (error) {
			console.error("Prediction failed:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen">
			<Navbar />

			<main className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold mb-8">🔮 Generate Predictions</h1>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Configuration Panel */}
					<div className="lg:col-span-1">
						<div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 sticky top-8">
							<h2 className="text-lg font-semibold mb-4">Configuration</h2>

							<div className="space-y-4">
								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Subject
									</label>
									<select
										value={config.subjectId}
										onChange={(e) =>
											setConfig({ ...config, subjectId: e.target.value })
										}
										className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
									>
										<option value="" className="bg-gray-800">
											Select Subject
										</option>
										{subjects.map((s) => (
											<option key={s.id} value={s.id} className="bg-gray-800">
												{s.code} - {s.name}
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Exam Type
									</label>
									<select
										value={config.examType}
										onChange={(e) =>
											setConfig({ ...config, examType: e.target.value })
										}
										className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
									>
										<option value="MIDTERM_1" className="bg-gray-800">
											Midterm 1
										</option>
										<option value="MIDTERM_2" className="bg-gray-800">
											Midterm 2
										</option>
										<option value="END_TERM" className="bg-gray-800">
											End Term
										</option>
									</select>
								</div>

								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Number of Questions: {config.questionCount}
									</label>
									<input
										type="range"
										min="5"
										max="20"
										value={config.questionCount}
										onChange={(e) =>
											setConfig({
												...config,
												questionCount: parseInt(e.target.value),
											})
										}
										className="w-full"
									/>
								</div>

								<button
									onClick={generatePredictions}
									disabled={!config.subjectId || loading}
									className={`w-full py-3 rounded-xl font-semibold transition-all mt-4
                    ${
											!config.subjectId || loading
												? "bg-gray-600 cursor-not-allowed"
												: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
										}`}
								>
									{loading ? (
										<span className="flex items-center justify-center gap-2">
											<div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
											Generating...
										</span>
									) : (
										"🔮 Generate Predictions"
									)}
								</button>
							</div>

							{/* Legend */}
							<div className="mt-6 pt-4 border-t border-white/10">
								<h3 className="text-sm font-semibold text-gray-400 mb-2">
									Probability Legend
								</h3>
								<div className="space-y-1 text-xs">
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full bg-red-500"></div>
										<span>High (70%+)</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full bg-yellow-500"></div>
										<span>Medium (40-70%)</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full bg-green-500"></div>
										<span>Low (&lt;40%)</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Predictions Results */}
					<div className="lg:col-span-2">
						{predictions.length === 0 && !loading ? (
							<div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/10 text-center">
								<span className="text-6xl">🎯</span>
								<h3 className="text-xl font-semibold mt-4">
									No Predictions Yet
								</h3>
								<p className="text-gray-400 mt-2">
									Select a subject and generate predictions to see results here
								</p>
							</div>
						) : loading ? (
							<div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/10 text-center">
								<div className="animate-spin h-16 w-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
								<h3 className="text-xl font-semibold mt-4">
									Analyzing Patterns...
								</h3>
								<p className="text-gray-400 mt-2">
									Gemini 3.0 is processing historical data and generating
									predictions
								</p>
							</div>
						) : (
							<div className="space-y-4">
								<div className="flex items-center justify-between mb-4">
									<h2 className="text-xl font-semibold">
										Predicted Questions ({predictions.length})
									</h2>
									<button className="text-sm bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
										📥 Export PDF
									</button>
								</div>

								{predictions.map((pred, index) => (
									<PredictionCard
										key={pred.id}
										prediction={pred}
										index={index + 1}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

function PredictionCard({
	prediction,
	index,
}: {
	prediction: PredictedQuestion;
	index: number;
}) {
	const [expanded, setExpanded] = useState(false);

	const probabilityColor =
		prediction.probability >= 0.7
			? "border-red-500 bg-red-500/10"
			: prediction.probability >= 0.4
			? "border-yellow-500 bg-yellow-500/10"
			: "border-green-500 bg-green-500/10";

	const probabilityBg =
		prediction.probability >= 0.7
			? "bg-red-500"
			: prediction.probability >= 0.4
			? "bg-yellow-500"
			: "bg-green-500";

	return (
		<div
			className={`bg-white/10 backdrop-blur-lg rounded-xl p-5 border-l-4 ${probabilityColor}`}
		>
			<div className="flex items-start gap-4">
				<div
					className={`w-10 h-10 ${probabilityBg} rounded-full flex items-center justify-center font-bold shrink-0`}
				>
					{index}
				</div>

				<div className="flex-1">
					<div className="flex items-start justify-between gap-4">
						<p className="font-medium text-white leading-relaxed">
							{prediction.text}
						</p>
						<div className="text-right shrink-0">
							<span className="text-2xl font-bold">
								{Math.round(prediction.probability * 100)}%
							</span>
							<p className="text-xs text-gray-400">probability</p>
						</div>
					</div>

					<div className="flex flex-wrap gap-2 mt-3">
						<span className="px-2 py-1 bg-purple-500/30 rounded text-xs">
							📚 {prediction.module}
						</span>
						<span className="px-2 py-1 bg-blue-500/30 rounded text-xs">
							📝 {prediction.topic}
						</span>
						<span className="px-2 py-1 bg-pink-500/30 rounded text-xs">
							📊 {prediction.difficulty}
						</span>
						<span className="px-2 py-1 bg-green-500/30 rounded text-xs">
							🎯 {prediction.marks} marks
						</span>
					</div>

					<button
						onClick={() => setExpanded(!expanded)}
						className="text-purple-400 text-sm mt-3 hover:text-purple-300"
					>
						{expanded ? "▲ Hide reasoning" : "▼ Show reasoning"}
					</button>

					{expanded && (
						<div className="mt-3 p-3 bg-white/5 rounded-lg">
							<p className="text-sm text-gray-400 font-medium mb-2">
								Why this prediction:
							</p>
							<ul className="space-y-1">
								{prediction.reasoning.map((r, i) => (
									<li
										key={i}
										className="text-sm text-gray-300 flex items-start gap-2"
									>
										<span className="text-purple-400">•</span> {r}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
