import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import OpenAI, { toFile } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { nutritionEstimateSchema, type AiMetadata, type NutritionEstimate } from "../../shared/schemas.js";

const projectRoot = process.cwd();

export interface NutritionAnalysis {
  estimate: NutritionEstimate;
  metadata: AiMetadata;
}

export interface TranscriptionResult {
  text: string;
  model: string;
  latencyMs: number;
}

export interface AiService {
  analyzeNutrition(description: string, images: Array<{ buffer: Buffer; mimeType: string }>): Promise<NutritionAnalysis>;
  transcribe(audio: { buffer: Buffer; filename: string; mimeType: string }): Promise<TranscriptionResult>;
}

async function loadPrompt(filename: string) {
  const text = await readFile(resolve(projectRoot, "prompts", filename), "utf8");
  return { text, hash: createHash("sha256").update(text).digest("hex").slice(0, 12) };
}

export class OpenAiService implements AiService {
  private readonly client: OpenAI;

  constructor(apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
    this.client = new OpenAI({ apiKey });
  }

  async analyzeNutrition(description: string, images: Array<{ buffer: Buffer; mimeType: string }>): Promise<NutritionAnalysis> {
    const prompt = await loadPrompt("nutrition-analysis.md");
    const model = process.env.OPENAI_NUTRITION_MODEL || "gpt-6.1-sol";
    const detail = (process.env.OPENAI_IMAGE_DETAIL || "high") as "low" | "high" | "auto" | "original";
    const started = Date.now();
    const content: Array<Record<string, unknown>> = [
      { type: "input_text", text: description || "Estimate this meal from the supplied images." },
      ...images.map((image) => ({
        type: "input_image",
        image_url: `data:${image.mimeType};base64,${image.buffer.toString("base64")}`,
        detail,
      })),
    ];

    const response = await this.client.responses.parse({
      model,
      store: false,
      instructions: prompt.text,
      input: [{ role: "user", content: content as never }],
      text: { format: zodTextFormat(nutritionEstimateSchema, "nutrition_estimate") },
    });
    if (!response.output_parsed) throw new Error("OpenAI returned no nutrition estimate");
    const usage = response.usage;

    return {
      estimate: response.output_parsed,
      metadata: {
        model,
        promptHash: prompt.hash,
        latencyMs: Date.now() - started,
        inputTokens: usage?.input_tokens ?? null,
        outputTokens: usage?.output_tokens ?? null,
        cachedTokens: usage?.input_tokens_details?.cached_tokens ?? null,
        confidence: response.output_parsed.confidence,
        assumptions: response.output_parsed.assumptions,
      },
    };
  }

  async transcribe(audio: { buffer: Buffer; filename: string; mimeType: string }): Promise<TranscriptionResult> {
    const prompt = await loadPrompt("transcription-context.txt");
    const model = process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-transcribe";
    const started = Date.now();
    const file = await toFile(audio.buffer, audio.filename, { type: audio.mimeType });
    const result = await this.client.audio.transcriptions.create({ model, file, prompt: prompt.text });
    return { text: result.text, model, latencyMs: Date.now() - started };
  }
}
