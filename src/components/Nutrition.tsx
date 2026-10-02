import { ChevronDown, Sparkles } from "lucide-react";
import type { AiMetadata, MealEntry, QuickFood, Settings } from "../../shared/schemas";
import { rounded } from "../utils";

export function MacroRow({ item }: { item: Pick<QuickFood, "calories" | "proteinGrams" | "carbsGrams" | "fatGrams"> }) {
  return <div className="macro-row"><span><b>{rounded(item.calories)}</b> cal</span><span><b>{rounded(item.proteinGrams)}</b>g P</span><span><b>{rounded(item.carbsGrams)}</b>g C</span><span><b>{rounded(item.fatGrams)}</b>g F</span></div>;
}

export function AiDetails({ metadata }: { metadata: AiMetadata | null }) {
  if (!metadata) return null;
  return (
    <details className="ai-details">
      <summary><Sparkles size={14} />AI estimate details<ChevronDown size={14} /></summary>
      <div className="ai-details-grid">
        <span>Confidence<b>{metadata.confidence}</b></span><span>Model<b>{metadata.model}</b></span><span>Latency<b>{(metadata.latencyMs / 1000).toFixed(1)}s</b></span><span>Prompt<b>{metadata.promptHash}</b></span>
      </div>
      {metadata.assumptions.length > 0 && <ul>{metadata.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>}
      {(metadata.inputTokens !== null || metadata.outputTokens !== null) && <p className="token-note">{metadata.inputTokens ?? 0} input · {metadata.outputTokens ?? 0} output · {metadata.cachedTokens ?? 0} cached tokens</p>}
    </details>
  );
}

export function ProgressMetric({ label, value, goal, color }: { label: string; value: number; goal: number | null; color: string }) {
  const percent = goal ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <div className="progress-metric">
      <div><span>{label}</span><strong>{rounded(value)}{label === "Calories" ? "" : "g"}{goal !== null && <small> / {rounded(goal)}{label === "Calories" ? "" : "g"}</small>}</strong></div>
      <div className="progress-track"><span style={{ width: `${percent}%`, background: color }} /></div>
    </div>
  );
}

export function mealTotals(meals: MealEntry[]) {
  return meals.reduce((total, meal) => ({
    calories: total.calories + meal.calories,
    proteinGrams: total.proteinGrams + meal.proteinGrams,
    carbsGrams: total.carbsGrams + meal.carbsGrams,
    fatGrams: total.fatGrams + meal.fatGrams,
  }), { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 });
}

export function goalsConfigured(settings: Settings) {
  return [settings.calorieGoal, settings.proteinGoal, settings.carbsGoal, settings.fatGoal].some((value) => value !== null);
}
