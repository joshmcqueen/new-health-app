import multipart from "@fastify/multipart";
import staticPlugin from "@fastify/static";
import Fastify from "fastify";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import {
  mealInputSchema,
  mealTypeSchema,
  nutritionFieldsSchema,
  settingsSchema,
  weightInputSchema,
} from "../shared/schemas.js";
import { createDatabase, type HealthDatabase } from "./db/database.js";
import {
  createFood,
  createMeal,
  deleteMeal,
  deleteWeight,
  getAnalytics,
  getSettings,
  listFoods,
  listMeals,
  listWeights,
  logQuickFood,
  setFoodArchived,
  updateFood,
  updateMeal,
  updateSettings,
  upsertWeight,
} from "./db/repositories.js";
import { OpenAiService, type AiService } from "./openai/service.js";

const idSchema = z.coerce.number().int().positive();
const rangeSchema = z.object({ start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export interface AppOptions {
  database?: HealthDatabase;
  aiService?: AiService | null;
  logger?: boolean;
}

export async function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: options.logger ?? false });
  const db = options.database ?? createDatabase();
  let aiService = options.aiService;
  if (aiService === undefined) {
    try { aiService = new OpenAiService(); } catch { aiService = null; }
  }

  await app.register(multipart, {
    limits: { files: 4, fileSize: 12 * 1024 * 1024, fields: 12 },
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof z.ZodError) return reply.status(400).send({ error: "Invalid request", issues: error.issues });
    app.log.error(error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return reply.status((error as { statusCode?: number }).statusCode ?? 500).send({ error: message });
  });

  app.get("/api/health", async () => ({ ok: true, openAiConfigured: Boolean(aiService) }));
  app.get("/api/settings", async () => getSettings(db));
  app.patch("/api/settings", async (request) => updateSettings(db, settingsSchema.parse(request.body)));

  app.get("/api/weights", async (request) => {
    const query = z.object({ start: z.string().optional(), end: z.string().optional() }).parse(request.query);
    return listWeights(db, query.start, query.end);
  });
  app.put("/api/weights", async (request) => upsertWeight(db, weightInputSchema.parse(request.body)));
  app.delete("/api/weights/:id", async (request, reply) => {
    if (!deleteWeight(db, idSchema.parse((request.params as { id: string }).id))) return reply.status(404).send({ error: "Weight not found" });
    return reply.status(204).send();
  });

  app.get("/api/foods", async (request) => {
    const query = z.object({ archived: z.coerce.boolean().optional() }).parse(request.query);
    return listFoods(db, query.archived ?? false);
  });
  app.post("/api/foods", async (request, reply) => reply.status(201).send(createFood(db, nutritionFieldsSchema.parse(request.body))));
  app.patch("/api/foods/:id", async (request, reply) => {
    const food = updateFood(db, idSchema.parse((request.params as { id: string }).id), nutritionFieldsSchema.parse(request.body));
    return food ? food : reply.status(404).send({ error: "Food not found" });
  });
  app.post("/api/foods/:id/archive", async (request, reply) => {
    const body = z.object({ archived: z.boolean() }).parse(request.body);
    const food = setFoodArchived(db, idSchema.parse((request.params as { id: string }).id), body.archived);
    return food ? food : reply.status(404).send({ error: "Food not found" });
  });

  app.get("/api/meals", async (request) => {
    const range = rangeSchema.parse(request.query);
    return listMeals(db, range.start, range.end);
  });
  app.post("/api/meals", async (request, reply) => reply.status(201).send(createMeal(db, mealInputSchema.parse(request.body))));
  app.post("/api/meals/from-food", async (request, reply) => {
    const body = z.object({ quickFoodId: idSchema, date: rangeSchema.shape.start, loggedAt: z.string(), mealType: mealTypeSchema }).parse(request.body);
    const meal = logQuickFood(db, body.quickFoodId, body.date, body.loggedAt, body.mealType);
    return meal ? reply.status(201).send(meal) : reply.status(404).send({ error: "Food not found or archived" });
  });
  app.patch("/api/meals/:id", async (request, reply) => {
    const meal = updateMeal(db, idSchema.parse((request.params as { id: string }).id), mealInputSchema.parse(request.body));
    return meal ? meal : reply.status(404).send({ error: "Meal not found" });
  });
  app.delete("/api/meals/:id", async (request, reply) => {
    if (!deleteMeal(db, idSchema.parse((request.params as { id: string }).id))) return reply.status(404).send({ error: "Meal not found" });
    return reply.status(204).send();
  });

  app.get("/api/analytics", async (request) => {
    const range = rangeSchema.parse(request.query);
    return getAnalytics(db, range.start, range.end);
  });

  app.post("/api/ai/transcriptions", async (request, reply) => {
    if (!aiService) return reply.status(503).send({ error: "OpenAI is not configured" });
    const part = await request.file();
    if (!part) return reply.status(400).send({ error: "An audio file is required" });
    const buffer = await part.toBuffer();
    return aiService.transcribe({ buffer, filename: part.filename || "recording.webm", mimeType: part.mimetype });
  });

  app.post("/api/ai/nutrition", async (request, reply) => {
    if (!aiService) return reply.status(503).send({ error: "OpenAI is not configured" });
    const fields: Record<string, string> = {};
    const images: Array<{ buffer: Buffer; mimeType: string }> = [];
    for await (const part of request.parts()) {
      if (part.type === "file") {
        if (!part.mimetype.startsWith("image/")) return reply.status(400).send({ error: "Only image uploads are accepted" });
        images.push({ buffer: await part.toBuffer(), mimeType: part.mimetype });
      } else {
        fields[part.fieldname] = String(part.value);
      }
    }
    const form = z.object({
      mode: z.enum(["quick_food", "meal_log"]),
      description: z.string().default(""),
      date: rangeSchema.shape.start.optional(),
      loggedAt: z.string().optional(),
      mealType: mealTypeSchema.optional(),
    }).parse(fields);
    if (!form.description.trim() && !images.length) return reply.status(400).send({ error: "Add a description, recording, or photo" });
    const analysis = await aiService.analyzeNutrition(form.description, images);
    const nutrition = nutritionFieldsSchema.parse(analysis.estimate);
    if (form.mode === "quick_food") {
      return reply.status(201).send({ kind: "quick_food", item: createFood(db, nutrition, analysis.metadata) });
    }
    if (!form.date || !form.loggedAt || !form.mealType) return reply.status(400).send({ error: "Meal date, time, and category are required" });
    const item = createMeal(db, { ...nutrition, date: form.date, loggedAt: form.loggedAt, mealType: form.mealType, quickFoodId: null }, analysis.metadata);
    return reply.status(201).send({ kind: "meal_log", item });
  });

  const distPath = resolve(process.cwd(), "dist");
  if (existsSync(distPath)) {
    await app.register(staticPlugin, { root: distPath });
    app.setNotFoundHandler((request, reply) => request.url.startsWith("/api/")
      ? reply.status(404).send({ error: "Not found" })
      : reply.sendFile("index.html"));
  }

  app.addHook("onClose", async () => { if (!options.database) db.close(); });
  return app;
}
