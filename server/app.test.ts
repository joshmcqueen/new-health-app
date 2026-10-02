// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { createDatabase, type HealthDatabase } from "./db/database.js";

let db: HealthDatabase | undefined;
let app: Awaited<ReturnType<typeof buildApp>> | undefined;
afterEach(async () => { await app?.close(); db?.close(); });

describe("health API", () => {
  it("persists settings and returns validation errors", async () => {
    db = createDatabase(":memory:");
    app = await buildApp({ database: db, aiService: null });
    const saved = await app.inject({ method: "PATCH", url: "/api/settings", payload: { goalWeight: 160, calorieGoal: 2000, proteinGoal: 160, carbsGoal: null, fatGoal: null, timezone: "America/Los_Angeles" } });
    expect(saved.statusCode).toBe(200);
    expect(saved.json()).toMatchObject({ calorieGoal: 2000, proteinGoal: 160 });
    const invalid = await app.inject({ method: "PUT", url: "/api/weights", payload: { date: "not-a-date", pounds: -1, note: null } });
    expect(invalid.statusCode).toBe(400);
  });

  it("reports when OpenAI is not configured", async () => {
    db = createDatabase(":memory:");
    app = await buildApp({ database: db, aiService: null });
    const response = await app.inject({ method: "GET", url: "/api/health" });
    expect(response.json()).toEqual({ ok: true, openAiConfigured: false });
  });

  it("deletes a quick food", async () => {
    db = createDatabase(":memory:");
    app = await buildApp({ database: db, aiService: null });
    const created = await app.inject({ method: "POST", url: "/api/foods", payload: { name: "Toast", description: "", calories: 120, proteinGrams: 4, carbsGrams: 22, fatGrams: 2 } });

    const deleted = await app.inject({ method: "DELETE", url: `/api/foods/${created.json().id}` });
    expect(deleted.statusCode).toBe(204);
    expect((await app.inject({ method: "GET", url: "/api/foods" })).json()).toEqual([]);
  });

  it("seeds an empty tracker once and clears it back to defaults", async () => {
    db = createDatabase(":memory:");
    app = await buildApp({ database: db, aiService: null });

    const seeded = await app.inject({ method: "POST", url: "/api/data/seed", payload: { today: "2026-10-01" } });
    expect(seeded.statusCode).toBe(200);
    expect(seeded.json()).toEqual({ days: 7, meals: 28, weights: 7, foods: 4 });
    expect((await app.inject({ method: "GET", url: "/api/meals?start=2026-09-25&end=2026-10-01" })).json()).toHaveLength(28);

    const duplicate = await app.inject({ method: "POST", url: "/api/data/seed", payload: { today: "2026-10-01" } });
    expect(duplicate.statusCode).toBe(409);

    const cleared = await app.inject({ method: "DELETE", url: "/api/data" });
    expect(cleared.statusCode).toBe(200);
    expect(cleared.json()).toMatchObject({ goalWeight: 160, calorieGoal: 2000, proteinGoal: 160, carbsGoal: 200, fatGoal: 65 });
    expect((await app.inject({ method: "GET", url: "/api/weights" })).json()).toEqual([]);
    expect((await app.inject({ method: "GET", url: "/api/foods" })).json()).toEqual([]);
  });
});
