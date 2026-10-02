import type { HealthDatabase } from "./database.js";
import type {
  AiMetadata,
  DailyAnalytics,
  MealEntry,
  MealInput,
  MealType,
  NutritionFields,
  QuickFood,
  Settings,
  WeightEntry,
  WeightInput,
} from "../../shared/schemas.js";
import { DEFAULT_SETTINGS } from "../../shared/schemas.js";

type Row = Record<string, unknown>;

function parseMetadata(value: unknown): AiMetadata | null {
  return typeof value === "string" && value ? (JSON.parse(value) as AiMetadata) : null;
}

function mapWeight(row: Row): WeightEntry {
  return {
    id: Number(row.id),
    date: String(row.entry_date),
    pounds: Number(row.pounds),
    note: row.note === null ? null : String(row.note),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapFood(row: Row): QuickFood {
  return {
    id: Number(row.id),
    name: String(row.name),
    description: String(row.description),
    calories: Number(row.calories),
    proteinGrams: Number(row.protein_grams),
    carbsGrams: Number(row.carbs_grams),
    fatGrams: Number(row.fat_grams),
    aiMetadata: parseMetadata(row.ai_metadata),
    archivedAt: row.archived_at === null ? null : String(row.archived_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapMeal(row: Row): MealEntry {
  return {
    id: Number(row.id),
    date: String(row.local_date),
    loggedAt: String(row.logged_at),
    mealType: String(row.meal_type) as MealType,
    quickFoodId: row.quick_food_id === null ? null : Number(row.quick_food_id),
    inheritsQuickFood: Boolean(row.inherits_quick_food),
    name: String(row.name),
    description: String(row.description),
    calories: Number(row.calories),
    proteinGrams: Number(row.protein_grams),
    carbsGrams: Number(row.carbs_grams),
    fatGrams: Number(row.fat_grams),
    aiMetadata: parseMetadata(row.ai_metadata),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function getSettings(db: HealthDatabase): Settings {
  const row = db.prepare("SELECT * FROM settings WHERE id = 1").get() as Row;
  return {
    goalWeight: row.goal_weight === null ? null : Number(row.goal_weight),
    calorieGoal: row.calorie_goal === null ? null : Number(row.calorie_goal),
    proteinGoal: row.protein_goal === null ? null : Number(row.protein_goal),
    carbsGoal: row.carbs_goal === null ? null : Number(row.carbs_goal),
    fatGoal: row.fat_goal === null ? null : Number(row.fat_goal),
    timezone: String(row.timezone),
  };
}

export function updateSettings(db: HealthDatabase, settings: Settings): Settings {
  db.prepare(`
    UPDATE settings SET goal_weight = ?, calorie_goal = ?, protein_goal = ?, carbs_goal = ?, fat_goal = ?, timezone = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(settings.goalWeight, settings.calorieGoal, settings.proteinGoal, settings.carbsGoal, settings.fatGoal, settings.timezone);
  return getSettings(db);
}

export function clearAllData(db: HealthDatabase): Settings {
  return db.transaction(() => {
    db.prepare("DELETE FROM meal_entries").run();
    db.prepare("DELETE FROM quick_foods").run();
    db.prepare("DELETE FROM weight_entries").run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('meal_entries', 'quick_foods', 'weight_entries')").run();
    return updateSettings(db, DEFAULT_SETTINGS);
  })();
}

const sampleFoods: NutritionFields[] = [
  { name: "Greek yogurt & berries", description: "Plain Greek yogurt, blueberries, strawberries, and chia seeds", calories: 310, proteinGrams: 28, carbsGrams: 35, fatGrams: 7 },
  { name: "Apple & almond butter", description: "One crisp apple with almond butter", calories: 245, proteinGrams: 6, carbsGrams: 32, fatGrams: 12 },
  { name: "Protein smoothie", description: "Protein powder, banana, spinach, and unsweetened almond milk", calories: 330, proteinGrams: 34, carbsGrams: 39, fatGrams: 6 },
  { name: "Hummus & vegetables", description: "Hummus with carrots, cucumber, and bell pepper", calories: 220, proteinGrams: 7, carbsGrams: 28, fatGrams: 10 },
];

const sampleMeals: Record<MealType, NutritionFields[]> = {
  breakfast: [
    sampleFoods[0],
    { name: "Veggie egg scramble", description: "Eggs, egg whites, spinach, peppers, avocado, and whole-grain toast", calories: 430, proteinGrams: 34, carbsGrams: 36, fatGrams: 18 },
    { name: "Protein oatmeal", description: "Oats, protein powder, banana, walnuts, and cinnamon", calories: 455, proteinGrams: 32, carbsGrams: 58, fatGrams: 12 },
  ],
  lunch: [
    { name: "Grilled chicken grain bowl", description: "Chicken, quinoa, greens, cucumber, tomato, and lemon tahini", calories: 575, proteinGrams: 48, carbsGrams: 56, fatGrams: 19 },
    { name: "Turkey avocado wrap", description: "Turkey, avocado, greens, tomato, and mustard in a whole-grain wrap", calories: 510, proteinGrams: 42, carbsGrams: 49, fatGrams: 17 },
    { name: "Salmon power salad", description: "Roasted salmon, mixed greens, chickpeas, vegetables, and vinaigrette", calories: 540, proteinGrams: 41, carbsGrams: 38, fatGrams: 25 },
  ],
  dinner: [
    { name: "Salmon, sweet potato & broccoli", description: "Roasted salmon with sweet potato and broccoli", calories: 610, proteinGrams: 47, carbsGrams: 59, fatGrams: 22 },
    { name: "Chicken vegetable stir-fry", description: "Chicken breast and vegetables with brown rice and ginger sauce", calories: 625, proteinGrams: 52, carbsGrams: 70, fatGrams: 16 },
    { name: "Turkey meatballs & pasta", description: "Turkey meatballs, whole-wheat pasta, tomato sauce, and a side salad", calories: 650, proteinGrams: 49, carbsGrams: 73, fatGrams: 19 },
  ],
  snack: [sampleFoods[1], sampleFoods[2], sampleFoods[3]],
};

function sampleDates(today: string) {
  const cursor = new Date(`${today}T12:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(cursor);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
}

export function seedSampleData(db: HealthDatabase, today: string) {
  const hasData = (["weight_entries", "meal_entries", "quick_foods"] as const)
    .some((table) => Number((db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as Row).count) > 0);
  if (hasData) return null;

  return db.transaction(() => {
    sampleFoods.forEach((food) => createFood(db, food));
    const dates = sampleDates(today);
    dates.forEach((date, index) => {
      upsertWeight(db, { date, pounds: Number((164.8 - index * 0.18 + (index % 2 ? 0.1 : 0)).toFixed(1)), note: "Sample data" });
      const schedule: Array<[MealType, string]> = [
        ["breakfast", "08:00:00"],
        ["lunch", "12:30:00"],
        ["snack", "15:30:00"],
        ["dinner", "19:00:00"],
      ];
      schedule.forEach(([mealType, time], mealIndex) => {
        const choices = sampleMeals[mealType];
        const nutrition = choices[(index + mealIndex) % choices.length];
        createMeal(db, { ...nutrition, date, loggedAt: `${date}T${time}`, mealType, quickFoodId: null });
      });
    });
    return { days: dates.length, meals: dates.length * 4, weights: dates.length, foods: sampleFoods.length };
  })();
}

export function listWeights(db: HealthDatabase, start?: string, end?: string): WeightEntry[] {
  const clauses: string[] = [];
  const params: string[] = [];
  if (start) { clauses.push("entry_date >= ?"); params.push(start); }
  if (end) { clauses.push("entry_date <= ?"); params.push(end); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return (db.prepare(`SELECT * FROM weight_entries ${where} ORDER BY entry_date DESC`).all(...params) as Row[]).map(mapWeight);
}

export function upsertWeight(db: HealthDatabase, input: WeightInput): WeightEntry {
  db.prepare(`
    INSERT INTO weight_entries (entry_date, pounds, note) VALUES (?, ?, ?)
    ON CONFLICT(entry_date) DO UPDATE SET pounds = excluded.pounds, note = excluded.note, updated_at = CURRENT_TIMESTAMP
  `).run(input.date, input.pounds, input.note);
  return mapWeight(db.prepare("SELECT * FROM weight_entries WHERE entry_date = ?").get(input.date) as Row);
}

export function deleteWeight(db: HealthDatabase, id: number) {
  return db.prepare("DELETE FROM weight_entries WHERE id = ?").run(id).changes > 0;
}

export function listFoods(db: HealthDatabase, includeArchived = false): QuickFood[] {
  const where = includeArchived ? "" : "WHERE archived_at IS NULL";
  return (db.prepare(`SELECT * FROM quick_foods ${where} ORDER BY name COLLATE NOCASE`).all() as Row[]).map(mapFood);
}

export function getFood(db: HealthDatabase, id: number): QuickFood | null {
  const row = db.prepare("SELECT * FROM quick_foods WHERE id = ?").get(id) as Row | undefined;
  return row ? mapFood(row) : null;
}

export function createFood(db: HealthDatabase, input: NutritionFields, aiMetadata: AiMetadata | null = null): QuickFood {
  const result = db.prepare(`
    INSERT INTO quick_foods (name, description, calories, protein_grams, carbs_grams, fat_grams, ai_metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(input.name, input.description, input.calories, input.proteinGrams, input.carbsGrams, input.fatGrams, aiMetadata ? JSON.stringify(aiMetadata) : null);
  return getFood(db, Number(result.lastInsertRowid))!;
}

export function updateFood(db: HealthDatabase, id: number, input: NutritionFields): QuickFood | null {
  const update = db.transaction(() => {
    const result = db.prepare(`
      UPDATE quick_foods SET name = ?, description = ?, calories = ?, protein_grams = ?, carbs_grams = ?, fat_grams = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(input.name, input.description, input.calories, input.proteinGrams, input.carbsGrams, input.fatGrams, id);
    if (!result.changes) return null;
    db.prepare(`
      UPDATE meal_entries SET name = ?, description = ?, calories = ?, protein_grams = ?, carbs_grams = ?, fat_grams = ?, updated_at = CURRENT_TIMESTAMP
      WHERE quick_food_id = ? AND inherits_quick_food = 1
    `).run(input.name, input.description, input.calories, input.proteinGrams, input.carbsGrams, input.fatGrams, id);
    return getFood(db, id);
  });
  return update();
}

export function deleteFood(db: HealthDatabase, id: number) {
  return db.transaction(() => {
    db.prepare("UPDATE meal_entries SET quick_food_id = NULL, inherits_quick_food = 0 WHERE quick_food_id = ?").run(id);
    return db.prepare("DELETE FROM quick_foods WHERE id = ?").run(id).changes > 0;
  })();
}

export function setFoodArchived(db: HealthDatabase, id: number, archived: boolean): QuickFood | null {
  const result = db.prepare("UPDATE quick_foods SET archived_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(archived ? new Date().toISOString() : null, id);
  return result.changes ? getFood(db, id) : null;
}

export function listMeals(db: HealthDatabase, start: string, end: string): MealEntry[] {
  return (db.prepare(`
    SELECT * FROM meal_entries WHERE local_date >= ? AND local_date <= ? ORDER BY logged_at DESC, id DESC
  `).all(start, end) as Row[]).map(mapMeal);
}

export function getMeal(db: HealthDatabase, id: number): MealEntry | null {
  const row = db.prepare("SELECT * FROM meal_entries WHERE id = ?").get(id) as Row | undefined;
  return row ? mapMeal(row) : null;
}

export function createMeal(db: HealthDatabase, input: MealInput, aiMetadata: AiMetadata | null = null): MealEntry {
  const result = db.prepare(`
    INSERT INTO meal_entries (local_date, logged_at, meal_type, quick_food_id, inherits_quick_food, name, description, calories, protein_grams, carbs_grams, fat_grams, ai_metadata)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
  `).run(input.date, input.loggedAt, input.mealType, input.quickFoodId, input.name, input.description, input.calories, input.proteinGrams, input.carbsGrams, input.fatGrams, aiMetadata ? JSON.stringify(aiMetadata) : null);
  return getMeal(db, Number(result.lastInsertRowid))!;
}

export function logQuickFood(db: HealthDatabase, quickFoodId: number, date: string, loggedAt: string, mealType: MealType): MealEntry | null {
  const food = getFood(db, quickFoodId);
  if (!food || food.archivedAt) return null;
  const result = db.prepare(`
    INSERT INTO meal_entries (local_date, logged_at, meal_type, quick_food_id, inherits_quick_food, name, description, calories, protein_grams, carbs_grams, fat_grams, ai_metadata)
    VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
  `).run(date, loggedAt, mealType, food.id, food.name, food.description, food.calories, food.proteinGrams, food.carbsGrams, food.fatGrams, food.aiMetadata ? JSON.stringify(food.aiMetadata) : null);
  return getMeal(db, Number(result.lastInsertRowid))!;
}

export function updateMeal(db: HealthDatabase, id: number, input: MealInput): MealEntry | null {
  const result = db.prepare(`
    UPDATE meal_entries SET local_date = ?, logged_at = ?, meal_type = ?, quick_food_id = ?, inherits_quick_food = 0,
      name = ?, description = ?, calories = ?, protein_grams = ?, carbs_grams = ?, fat_grams = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(input.date, input.loggedAt, input.mealType, input.quickFoodId, input.name, input.description, input.calories, input.proteinGrams, input.carbsGrams, input.fatGrams, id);
  return result.changes ? getMeal(db, id) : null;
}

export function deleteMeal(db: HealthDatabase, id: number) {
  return db.prepare("DELETE FROM meal_entries WHERE id = ?").run(id).changes > 0;
}

function dateRange(start: string, end: string) {
  const dates: string[] = [];
  const cursor = new Date(`${start}T12:00:00Z`);
  const finish = new Date(`${end}T12:00:00Z`);
  while (cursor <= finish) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function getAnalytics(db: HealthDatabase, start: string, end: string): DailyAnalytics[] {
  const meals = db.prepare(`
    SELECT local_date AS date, SUM(calories) AS calories, SUM(protein_grams) AS protein,
      SUM(carbs_grams) AS carbs, SUM(fat_grams) AS fat
    FROM meal_entries WHERE local_date >= ? AND local_date <= ? GROUP BY local_date
  `).all(start, end) as Row[];
  const weights = db.prepare("SELECT entry_date AS date, pounds FROM weight_entries WHERE entry_date >= ? AND entry_date <= ?")
    .all(start, end) as Row[];
  const mealMap = new Map(meals.map((row) => [String(row.date), row]));
  const weightMap = new Map(weights.map((row) => [String(row.date), Number(row.pounds)]));
  return dateRange(start, end).map((date) => {
    const row = mealMap.get(date);
    return {
      date,
      weight: weightMap.get(date) ?? null,
      calories: Number(row?.calories ?? 0),
      proteinGrams: Number(row?.protein ?? 0),
      carbsGrams: Number(row?.carbs ?? 0),
      fatGrams: Number(row?.fat ?? 0),
    };
  });
}
