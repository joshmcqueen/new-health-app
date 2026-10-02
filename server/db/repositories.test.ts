// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import type { HealthDatabase } from "./database.js";
import { createDatabase, runMigrations } from "./database.js";
import { clearAllData, createFood, createMeal, deleteFood, getAnalytics, getFood, getSettings, listFoods, listMeals, listWeights, logQuickFood, seedSampleData, updateFood, updateMeal, upsertWeight } from "./repositories.js";

let db: HealthDatabase | undefined;
afterEach(() => db?.close());

const yogurt = { name: "Yogurt bowl", description: "Yogurt, berries, granola", calories: 410, proteinGrams: 28, carbsGrams: 52, fatGrams: 10 };

describe("SQLite repositories", () => {
  it("runs migrations idempotently and upserts one weight per date", () => {
    db = createDatabase(":memory:");
    runMigrations(db);
    upsertWeight(db, { date: "2026-10-01", pounds: 185.2, note: null });
    upsertWeight(db, { date: "2026-10-01", pounds: 184.8, note: "morning" });
    expect(listWeights(db)).toMatchObject([{ date: "2026-10-01", pounds: 184.8, note: "morning" }]);
  });

  it("updates inherited meal history but preserves an individually edited meal", () => {
    db = createDatabase(":memory:");
    const food = createFood(db, yogurt);
    const inherited = logQuickFood(db, food.id, "2026-10-01", "2026-10-01T08:00:00", "breakfast")!;
    const overridden = logQuickFood(db, food.id, "2026-10-02", "2026-10-02T08:00:00", "breakfast")!;
    updateMeal(db, overridden.id, { ...yogurt, calories: 450, date: overridden.date, loggedAt: overridden.loggedAt, mealType: overridden.mealType, quickFoodId: food.id });
    updateFood(db, food.id, { ...yogurt, calories: 430 });
    const meals = listMeals(db, "2026-10-01", "2026-10-02");
    expect(meals.find((meal) => meal.id === inherited.id)?.calories).toBe(430);
    expect(meals.find((meal) => meal.id === overridden.id)?.calories).toBe(450);
  });

  it("deletes a quick food without deleting its meal history", () => {
    db = createDatabase(":memory:");
    const food = createFood(db, yogurt);
    const meal = logQuickFood(db, food.id, "2026-10-01", "2026-10-01T08:00:00", "breakfast")!;

    expect(deleteFood(db, food.id)).toBe(true);
    expect(getFood(db, food.id)).toBeNull();
    expect(listMeals(db, "2026-10-01", "2026-10-01")).toMatchObject([{ id: meal.id, quickFoodId: null, inheritsQuickFood: false }]);
  });

  it("returns zero-filled daily analytics and weight gaps", () => {
    db = createDatabase(":memory:");
    createMeal(db, { ...yogurt, date: "2026-10-02", loggedAt: "2026-10-02T09:00:00", mealType: "breakfast", quickFoodId: null });
    upsertWeight(db, { date: "2026-10-01", pounds: 185, note: null });
    const analytics = getAnalytics(db, "2026-10-01", "2026-10-03");
    expect(analytics).toHaveLength(3);
    expect(analytics[0]).toMatchObject({ weight: 185, calories: 0 });
    expect(analytics[1]).toMatchObject({ weight: null, calories: 410, proteinGrams: 28 });
    expect(analytics[2]).toMatchObject({ weight: null, calories: 0 });
  });

  it("seeds the seven days ending today only when empty", () => {
    db = createDatabase(":memory:");
    expect(seedSampleData(db, "2026-10-01")).toEqual({ days: 7, meals: 28, weights: 7, foods: 4 });
    expect(listWeights(db)).toHaveLength(7);
    expect(listWeights(db).at(-1)?.date).toBe("2026-09-25");
    expect(listMeals(db, "2026-09-25", "2026-10-01")).toHaveLength(28);
    expect(listFoods(db)).toHaveLength(4);
    expect(seedSampleData(db, "2026-10-01")).toBeNull();
  });

  it("clears tracker data and restores default goals", () => {
    db = createDatabase(":memory:");
    seedSampleData(db, "2026-10-01");
    clearAllData(db);
    expect(listWeights(db)).toEqual([]);
    expect(listMeals(db, "2026-09-25", "2026-10-01")).toEqual([]);
    expect(listFoods(db)).toEqual([]);
    expect(getSettings(db)).toMatchObject({ goalWeight: 160, calorieGoal: 2000, proteinGoal: 160, carbsGoal: 200, fatGoal: 65 });
  });
});
