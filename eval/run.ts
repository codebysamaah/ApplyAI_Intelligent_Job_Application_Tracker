import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { extractJobSkills } from "../lib/job-skill-extraction";

type Posting = {
  id: string;
  company?: string;
  jobTitle?: string;
  text: string;
  expected_skills: string[];
};

const aliases: Record<string, string> = {
  js: "javascript",
  "node js": "node.js",
  nodejs: "node.js",
  ts: "typescript",
  "c sharp": "c#",
  "dot net": ".net",
  postgres: "postgresql",
};

const norm = (value: string) => {
  const cleaned = value.toLowerCase().trim().replace(/\s+/g, " ");
  return aliases[cleaned] ?? cleaned;
};

function score(expected: string[], extracted: string[]) {
  const exp = new Set(expected.map(norm).filter(Boolean));
  const got = new Set(extracted.map(norm).filter(Boolean));
  const tp = [...got].filter((skill) => exp.has(skill)).length;
  const precision = got.size ? tp / got.size : 0;
  const recall = exp.size ? tp / exp.size : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { tp, fp: got.size - tp, fn: exp.size - tp, precision, recall, f1, extracted: [...got] };
}

function jaccard(a: string[], b: string[]) {
  const left = new Set(a.map(norm));
  const right = new Set(b.map(norm));
  const union = new Set([...left, ...right]);
  if (!union.size) return 1;
  return [...left].filter((skill) => right.has(skill)).length / union.size;
}

function mean(values: number[]) {
  return values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : 0;
}

function stddev(values: number[]) {
  const average = mean(values);
  return values.length ? Math.sqrt(mean(values.map((value) => (value - average) ** 2))) : 0;
}

const datasetPath = process.argv[2] ?? "eval/dataset.json";
const resultPath = process.env.EVAL_RESULTS_PATH ?? "eval/results.json";
const runs = Number(process.env.EVAL_RUNS ?? 2);
if (!Number.isInteger(runs) || runs < 1) throw new Error("EVAL_RUNS must be a positive integer");
const requestBudget = Number(process.env.EVAL_MAX_REQUESTS ?? 20);
if (!Number.isInteger(requestBudget) || requestBudget < runs) {
  throw new Error("EVAL_MAX_REQUESTS must be an integer at least as large as EVAL_RUNS");
}
if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");

const dataset = JSON.parse(await readFile(datasetPath, "utf8")) as Posting[];
if (!Array.isArray(dataset) || dataset.length === 0) throw new Error("Dataset must contain at least one labeled posting");
for (const posting of dataset) {
  if (!posting.id || !posting.text || !Array.isArray(posting.expected_skills)) {
    throw new Error("Each posting needs id, text, and expected_skills (which may be an empty array)");
  }
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const datasetHash = createHash("sha256").update(JSON.stringify(dataset)).digest("hex");
const postingResults: Array<{
  id: string;
  expected_skills: string[];
  runs: ReturnType<typeof score>[];
  macro: { precision: number; recall: number; f1: number; f1StdDev: number };
  consistency: number;
}> = [];

try {
  const existing = JSON.parse(await readFile(resultPath, "utf8"));
  if (existing.datasetHash === datasetHash && existing.runsPerPosting === runs && existing.model === "gemini-3.6-flash") {
    postingResults.push(...existing.postings);
    console.log(`Resuming from ${postingResults.length}/${dataset.length} completed postings.`);
  }
} catch {
  // No compatible checkpoint exists; start this evaluation from the beginning.
}

function makeOutput(complete: boolean, error?: string) {
  const allRuns = postingResults.flatMap((posting) => posting.runs);
  const tp = allRuns.reduce((sum, result) => sum + result.tp, 0);
  const fp = allRuns.reduce((sum, result) => sum + result.fp, 0);
  const fn = allRuns.reduce((sum, result) => sum + result.fn, 0);
  const macro = {
    precision: mean(allRuns.map((result) => result.precision)),
    recall: mean(allRuns.map((result) => result.recall)),
    f1: mean(allRuns.map((result) => result.f1)),
    f1StdDev: mean(postingResults.map((posting) => posting.macro.f1StdDev)),
    consistency: mean(postingResults.map((posting) => posting.consistency)),
  };
  const micro = {
    precision: tp + fp ? tp / (tp + fp) : 0,
    recall: tp + fn ? tp / (tp + fn) : 0,
    f1: tp + fp + fn ? (2 * tp) / (2 * tp + fp + fn) : 0,
    tp,
    fp,
    fn,
  };
  return {
    generatedAt: new Date().toISOString(),
    model: "gemini-3.6-flash",
    dataset: datasetPath,
    datasetHash,
    postingCount: dataset.length,
    completedPostings: postingResults.length,
    runsPerPosting: runs,
    complete,
    error,
    macro,
    micro,
    postings: postingResults,
  };
}

async function saveResults(complete: boolean, error?: string) {
  await writeFile(resultPath, `${JSON.stringify(makeOutput(complete, error), null, 2)}\n`);
}

const completedIds = new Set(postingResults.map((posting) => posting.id));
let stopReason: string | undefined;
let requestsUsed = 0;

for (const posting of dataset) {
  if (completedIds.has(posting.id)) continue;
  if (requestsUsed + runs > requestBudget) {
    stopReason = `Reached this run's ${requestBudget}-request budget; rerun after the Gemini quota resets to continue.`;
    break;
  }
  const runResults = [];
  for (let run = 0; run < runs; run++) {
    let analysis: Awaited<ReturnType<typeof extractJobSkills>>;
    requestsUsed++;
    try {
      analysis = await extractJobSkills(ai, {
        company: posting.company,
        jobTitle: posting.jobTitle,
        description: posting.text,
      });
    } catch (error) {
      stopReason = error instanceof Error ? error.message : String(error);
      console.error(`Stopped on ${posting.id}, run ${run + 1}/${runs}: ${stopReason}`);
      break;
    }
    const extracted = [
      ...analysis.requiredSkills,
      ...analysis.preferredSkills,
      ...analysis.programmingLanguages,
    ];
    const result = score(posting.expected_skills, extracted);
    runResults.push(result);
  }

  if (stopReason) break;

  const pairwiseSimilarities: number[] = [];
  for (let i = 0; i < runResults.length; i++) {
    for (let j = i + 1; j < runResults.length; j++) {
      pairwiseSimilarities.push(jaccard(runResults[i].extracted, runResults[j].extracted));
    }
  }
  postingResults.push({
    id: posting.id,
    expected_skills: posting.expected_skills,
    runs: runResults,
    macro: {
      precision: mean(runResults.map((result) => result.precision)),
      recall: mean(runResults.map((result) => result.recall)),
      f1: mean(runResults.map((result) => result.f1)),
      f1StdDev: stddev(runResults.map((result) => result.f1)),
    },
    consistency: mean(pairwiseSimilarities),
  });
  const completed = postingResults.at(-1)!;
  console.log(`${posting.id}: F1 ${completed.macro.f1.toFixed(3)}, consistency ${completed.consistency.toFixed(3)}`);
  await saveResults(false);
}

const complete = postingResults.length === dataset.length;
await saveResults(complete, stopReason);
const summary = makeOutput(complete, stopReason);
console.log(`Completed ${postingResults.length}/${dataset.length} postings.`);
console.log(`Gemini requests used this command: ${requestsUsed}/${requestBudget}.`);
console.log(`Macro P/R/F1: ${summary.macro.precision.toFixed(3)} / ${summary.macro.recall.toFixed(3)} / ${summary.macro.f1.toFixed(3)}`);
console.log(`Micro P/R/F1: ${summary.micro.precision.toFixed(3)} / ${summary.micro.recall.toFixed(3)} / ${summary.micro.f1.toFixed(3)}`);
console.log(`Consistency: ${summary.macro.consistency.toFixed(3)} | Mean within-posting F1 SD: ${summary.macro.f1StdDev.toFixed(3)}`);
console.log(`Wrote ${resultPath}${complete ? "" : " (partial; rerun to resume)"}`);
