import { Activity, ArrowDownRight, CalendarPlus, ChevronRight, CircleGauge, Pencil, Plus, Scale, Settings as SettingsIcon, Sparkles, Trash2, Utensils } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MealEntry, Settings, WeightEntry, WeightInput } from "../../shared/schemas";
import { DEFAULT_SETTINGS } from "../../shared/schemas";
import { api } from "../api";
import { AiCapture } from "../components/AiCapture";
import { EmptyState } from "../components/EmptyState";
import { WeightModal } from "../components/Forms";
import { Modal } from "../components/Modal";
import { AiDetails, MacroRow, ProgressMetric, mealTotals } from "../components/Nutrition";
import { dateLabel, localDate } from "../utils";

export function TodayPage() {
  const navigate = useNavigate();
  const today = localDate();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightOpen, setWeightOpen] = useState(false);
  const [weightHistoryOpen, setWeightHistoryOpen] = useState(false);
  const [weightEditing, setWeightEditing] = useState<WeightInput | undefined>();
  const [aiOpen, setAiOpen] = useState(false);

  const load = useCallback(async () => {
    const [nextSettings, nextWeights, nextMeals] = await Promise.all([api.getSettings(), api.getWeights(), api.getMeals(today)]);
    setSettings(nextSettings); setWeights(nextWeights); setMeals(nextMeals); setLoading(false);
  }, [today]);
  useEffect(() => { void load(); }, [load]);

  const todayWeight = weights.find((item) => item.date === today);
  const latestWeight = todayWeight ?? weights[0];
  const previousWeight = weights.find((item) => item.id !== latestWeight?.id);
  const delta = latestWeight && previousWeight ? latestWeight.pounds - previousWeight.pounds : null;
  const totals = mealTotals(meals);

  return (
    <div className="page today-page">
      <header className="page-header">
        <div><p className="eyebrow">{dateLabel(today)}</p><h1>Today</h1></div>
        <button className="icon-button surface" onClick={() => navigate("/settings")} aria-label="Settings"><SettingsIcon size={20} /></button>
      </header>

      {!loading && !latestWeight && meals.length === 0 && <section className="welcome-card"><span><Activity size={24} /></span><div><p className="eyebrow">Your private health journal</p><h2>Start with today.</h2><p>Record your weight, log a meal, or open Settings to add a sample week.</p></div><div className="welcome-actions"><button onClick={() => { setWeightEditing(undefined); setWeightOpen(true); }}><Scale size={18} />Log weight</button><button onClick={() => navigate("/settings")}><CircleGauge size={18} />Settings</button></div></section>}

      <section className="weight-card card-button" onClick={() => setWeightHistoryOpen(true)}>
        <div className="metric-icon blue"><Scale size={22} /></div>
        <div className="weight-content"><p>Weight</p>{latestWeight ? <><strong>{latestWeight.pounds.toFixed(1)} <small>lb</small></strong>{delta !== null && <span className={delta <= 0 ? "positive" : "muted"}><ArrowDownRight size={15} />{Math.abs(delta).toFixed(1)} lb since last entry</span>}{settings.goalWeight !== null && <span>Goal {settings.goalWeight.toFixed(1)} lb</span>}</> : <><strong className="empty-value">—</strong><span>{settings.goalWeight !== null ? `Goal ${settings.goalWeight.toFixed(1)} lb · tap to add` : "Tap to add today’s weight"}</span></>}</div>
        <ChevronRight size={20} className="chevron" />
      </section>

      <section className="nutrition-card">
        <div className="section-heading"><div><p className="eyebrow">Daily progress</p><h2>Nutrition</h2></div><span className="metric-icon coral"><Utensils size={20} /></span></div>
        <div className="calorie-hero"><strong>{Math.round(totals.calories).toLocaleString()}</strong><span>{settings.calorieGoal ? `/ ${Math.round(settings.calorieGoal).toLocaleString()} cal` : "calories"}</span></div>
        <div className="progress-grid">
          <ProgressMetric label="Calories" value={totals.calories} goal={settings.calorieGoal} color="var(--coral)" />
          <ProgressMetric label="Protein" value={totals.proteinGrams} goal={settings.proteinGoal} color="var(--green)" />
          <ProgressMetric label="Carbs" value={totals.carbsGrams} goal={settings.carbsGoal} color="var(--blue)" />
          <ProgressMetric label="Fat" value={totals.fatGrams} goal={settings.fatGoal} color="var(--orange)" />
        </div>
      </section>

      <div className="section-heading list-heading"><div><p className="eyebrow">{meals.length} {meals.length === 1 ? "entry" : "entries"}</p><h2>Today’s meals</h2></div><button className="text-button" onClick={() => setAiOpen(true)}><Sparkles size={17} />Analyze</button></div>
      {meals.length === 0 ? <EmptyState icon={CalendarPlus} title="Nothing logged yet" detail="Add a saved food or let OpenAI estimate a meal from a photo or description." action={<button className="secondary-button" onClick={() => setAiOpen(true)}><Plus size={17} />Add meal</button>} /> : <div className="meal-list">{meals.map((meal) => <article className="meal-card" key={meal.id}><div className="meal-icon">{meal.mealType.slice(0, 1).toUpperCase()}</div><div className="meal-info"><small>{meal.mealType}</small><h3>{meal.name}</h3>{meal.description && <p>{meal.description}</p>}<MacroRow item={meal} /><AiDetails metadata={meal.aiMetadata} /></div></article>)}</div>}

      {weightHistoryOpen && <Modal title="Weight history" eyebrow="One entry per day" onClose={() => setWeightHistoryOpen(false)}><div className="history-header"><p>Track the trend without overthinking each point.</p><button className="secondary-button" onClick={() => { setWeightEditing(undefined); setWeightOpen(true); }}><Plus size={16} />Add</button></div>{weights.length === 0 ? <EmptyState icon={Scale} title="No weights yet" detail="Add today’s weight or choose an earlier date." /> : <div className="weight-history">{weights.map((weight) => <div key={weight.id}><button className="weight-history-main" onClick={() => { setWeightEditing(weight); setWeightOpen(true); }}><span><b>{weight.pounds.toFixed(1)} lb</b><small>{dateLabel(weight.date, { month: "long", day: "numeric", year: "numeric" })}</small></span><Pencil size={16} /></button><button className="history-delete" onClick={async () => { await api.deleteWeight(weight.id); await load(); }} aria-label={`Delete weight from ${weight.date}`}><Trash2 size={16} /></button></div>)}</div>}</Modal>}
      {weightOpen && <WeightModal initial={weightEditing} onClose={() => setWeightOpen(false)} onSaved={() => { setWeightOpen(false); void load(); }} />}
      {aiOpen && <AiCapture mode="meal_log" date={today} onClose={() => setAiOpen(false)} onSaved={() => void load()} />}
    </div>
  );
}
