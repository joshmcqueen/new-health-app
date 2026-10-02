import type { DailyAnalytics, MealEntry, MealInput, NutritionFields, QuickFood, Settings, WeightEntry, WeightInput } from "../shared/schemas";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || "Request failed");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  health: () => request<{ ok: boolean; openAiConfigured: boolean }>("/api/health"),
  getSettings: () => request<Settings>("/api/settings"),
  updateSettings: (value: Settings) => request<Settings>("/api/settings", json("PATCH", value)),
  clearAllData: () => request<Settings>("/api/data", { method: "DELETE" }),
  seedSampleData: (today: string) => request<{ days: number; meals: number; weights: number; foods: number }>("/api/data/seed", json("POST", { today })),
  getWeights: () => request<WeightEntry[]>("/api/weights"),
  saveWeight: (value: WeightInput) => request<WeightEntry>("/api/weights", json("PUT", value)),
  deleteWeight: (id: number) => request<void>(`/api/weights/${id}`, { method: "DELETE" }),
  getFoods: () => request<QuickFood[]>("/api/foods"),
  createFood: (value: NutritionFields) => request<QuickFood>("/api/foods", json("POST", value)),
  updateFood: (id: number, value: NutritionFields) => request<QuickFood>(`/api/foods/${id}`, json("PATCH", value)),
  deleteFood: (id: number) => request<void>(`/api/foods/${id}`, { method: "DELETE" }),
  getMeals: (start: string, end = start) => request<MealEntry[]>(`/api/meals?start=${start}&end=${end}`),
  createMeal: (value: MealInput) => request<MealEntry>("/api/meals", json("POST", value)),
  logFood: (value: { quickFoodId: number; date: string; loggedAt: string; mealType: string }) =>
    request<MealEntry>("/api/meals/from-food", json("POST", value)),
  updateMeal: (id: number, value: MealInput) => request<MealEntry>(`/api/meals/${id}`, json("PATCH", value)),
  deleteMeal: (id: number) => request<void>(`/api/meals/${id}`, { method: "DELETE" }),
  getAnalytics: (start: string, end: string) => request<DailyAnalytics[]>(`/api/analytics?start=${start}&end=${end}`),
  transcribe: (form: FormData) => request<{ text: string; model: string; latencyMs: number }>("/api/ai/transcriptions", { method: "POST", body: form }),
  analyzeNutrition: (form: FormData) => request<{ kind: "quick_food" | "meal_log"; item: QuickFood | MealEntry }>("/api/ai/nutrition", { method: "POST", body: form }),
};
