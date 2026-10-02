import { z } from "zod";

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);
export const confidenceSchema = z.enum(["low", "medium", "high"]);

const nullableGoal = z.number().nonnegative().nullable();

export const settingsSchema = z.object({
  calorieGoal: nullableGoal,
  proteinGoal: nullableGoal,
  carbsGoal: nullableGoal,
  fatGoal: nullableGoal,
  timezone: z.string().min(1),
});

export const weightInputSchema = z.object({
  date: isoDateSchema,
  pounds: z.number().positive().max(1500),
  note: z.string().trim().max(500).nullable(),
});

export const weightEntrySchema = weightInputSchema.extend({
  id: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const nutritionFieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000),
  calories: z.number().nonnegative().max(10000),
  proteinGrams: z.number().nonnegative().max(1000),
  carbsGrams: z.number().nonnegative().max(2000),
  fatGrams: z.number().nonnegative().max(1000),
});

export const aiMetadataSchema = z.object({
  model: z.string(),
  promptHash: z.string(),
  latencyMs: z.number().int().nonnegative(),
  inputTokens: z.number().int().nonnegative().nullable(),
  outputTokens: z.number().int().nonnegative().nullable(),
  cachedTokens: z.number().int().nonnegative().nullable(),
  confidence: confidenceSchema,
  assumptions: z.array(z.string()),
  transcriptionModel: z.string().optional(),
});

export const quickFoodInputSchema = nutritionFieldsSchema;
export const quickFoodSchema = nutritionFieldsSchema.extend({
  id: z.number().int(),
  archivedAt: z.string().nullable(),
  aiMetadata: aiMetadataSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const mealInputSchema = nutritionFieldsSchema.extend({
  date: isoDateSchema,
  loggedAt: z.string(),
  mealType: mealTypeSchema,
  quickFoodId: z.number().int().nullable().default(null),
});

export const mealEntrySchema = mealInputSchema.extend({
  id: z.number().int(),
  inheritsQuickFood: z.boolean(),
  aiMetadata: aiMetadataSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const nutritionEstimateSchema = nutritionFieldsSchema.extend({
  confidence: confidenceSchema,
  assumptions: z.array(z.string()).max(8),
});

export const dailyAnalyticsSchema = z.object({
  date: isoDateSchema,
  weight: z.number().nullable(),
  calories: z.number(),
  proteinGrams: z.number(),
  carbsGrams: z.number(),
  fatGrams: z.number(),
});

export type Settings = z.infer<typeof settingsSchema>;
export type WeightInput = z.infer<typeof weightInputSchema>;
export type WeightEntry = z.infer<typeof weightEntrySchema>;
export type NutritionFields = z.infer<typeof nutritionFieldsSchema>;
export type AiMetadata = z.infer<typeof aiMetadataSchema>;
export type QuickFood = z.infer<typeof quickFoodSchema>;
export type MealInput = z.infer<typeof mealInputSchema>;
export type MealEntry = z.infer<typeof mealEntrySchema>;
export type MealType = z.infer<typeof mealTypeSchema>;
export type NutritionEstimate = z.infer<typeof nutritionEstimateSchema>;
export type DailyAnalytics = z.infer<typeof dailyAnalyticsSchema>;
