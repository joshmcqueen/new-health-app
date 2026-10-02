import { ChevronLeft, ChevronRight, Pencil, Plus, Sparkles, Trash2, Utensils } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { MealEntry, MealType, NutritionFields, QuickFood } from "../../shared/schemas";
import { api } from "../api";
import { AiCapture } from "../components/AiCapture";
import { EmptyState } from "../components/EmptyState";
import { NutritionModal } from "../components/Forms";
import { Modal } from "../components/Modal";
import { AiDetails, MacroRow, mealTotals } from "../components/Nutrition";
import { dateLabel, localDate, localDateTime, mealTypeNow } from "../utils";

function moveDate(value: string, offset: number) {
  const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() + offset); return localDate(date);
}

export function LogPage() {
  const [date, setDate] = useState(localDate());
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [foods, setFoods] = useState<QuickFood[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [editing, setEditing] = useState<MealEntry | null>(null);
  const [mealType, setMealType] = useState<MealType>(mealTypeNow());
  const load = useCallback(async () => { const [nextMeals, nextFoods] = await Promise.all([api.getMeals(date), api.getFoods()]); setMeals(nextMeals); setFoods(nextFoods); }, [date]);
  useEffect(() => { void load(); }, [load]);
  const totals = mealTotals(meals);

  async function saveManual(value: NutritionFields) {
    await api.createMeal({ ...value, date, loggedAt: localDateTime(date), mealType, quickFoodId: null }); await load();
  }
  async function saveEdit(value: NutritionFields) {
    if (!editing) return;
    await api.updateMeal(editing.id, { ...value, date: editing.date, loggedAt: editing.loggedAt, mealType: editing.mealType, quickFoodId: editing.quickFoodId }); await load();
  }

  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">Daily journal</p><h1>Meal log</h1></div><button className="round-add" onClick={() => setAiOpen(true)}><Plus size={21} /></button></header>
      <div className="date-switcher"><button onClick={() => setDate(moveDate(date, -1))}><ChevronLeft /></button><label><span>{date === localDate() ? "Today" : dateLabel(date, { weekday: "long" })}</span><b>{dateLabel(date, { month: "long", day: "numeric", year: "numeric" })}</b><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><button onClick={() => setDate(moveDate(date, 1))} disabled={date >= localDate()}><ChevronRight /></button></div>
      <section className="day-summary"><div><small>Calories</small><strong>{Math.round(totals.calories).toLocaleString()}</strong></div><div><small>Protein</small><strong>{Math.round(totals.proteinGrams)}g</strong></div><div><small>Carbs</small><strong>{Math.round(totals.carbsGrams)}g</strong></div><div><small>Fat</small><strong>{Math.round(totals.fatGrams)}g</strong></div></section>
      <div className="log-actions"><button onClick={() => setQuickOpen(true)}><Utensils size={18} />Quick food</button><button onClick={() => setAiOpen(true)}><Sparkles size={18} />Analyze</button><button onClick={() => setManualOpen(true)}><Pencil size={18} />Manual</button></div>

      {meals.length === 0 ? <EmptyState icon={Utensils} title="No meals on this day" detail="Use a quick food, enter values manually, or ask OpenAI to estimate the meal." /> : <div className="meal-list">{meals.map((meal) => <article className="meal-card" key={meal.id}><div className="meal-icon">{meal.mealType.slice(0, 1).toUpperCase()}</div><div className="meal-info"><small>{meal.mealType}</small><h3>{meal.name}</h3>{meal.description && <p>{meal.description}</p>}<MacroRow item={meal} /><AiDetails metadata={meal.aiMetadata} /></div><div className="row-actions"><button onClick={() => setEditing(meal)} aria-label="Edit"><Pencil size={17} /></button><button onClick={async () => { await api.deleteMeal(meal.id); await load(); }} aria-label="Delete"><Trash2 size={17} /></button></div></article>)}</div>}

      {quickOpen && <Modal title="Quick log" eyebrow={dateLabel(date)} onClose={() => setQuickOpen(false)}><div className="form-stack"><label><span>Meal</span><select value={mealType} onChange={(event) => setMealType(event.target.value as MealType)}><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label><div className="quick-list">{foods.map((food) => <button key={food.id} onClick={async () => { await api.logFood({ quickFoodId: food.id, date, loggedAt: localDateTime(date), mealType }); setQuickOpen(false); await load(); }}><span><b>{food.name}</b><small>{Math.round(food.calories)} cal · {Math.round(food.proteinGrams)}g protein</small></span><Plus size={18} /></button>)}</div>{foods.length === 0 && <p className="form-intro">Create a quick food in the Foods tab first.</p>}</div></Modal>}
      {aiOpen && <AiCapture mode="meal_log" date={date} onClose={() => setAiOpen(false)} onSaved={() => void load()} />}
      {manualOpen && <NutritionModal title="Manual meal" onClose={() => setManualOpen(false)} onSave={saveManual} />}
      {editing && <NutritionModal title="Edit meal" initial={editing} onClose={() => setEditing(null)} onSave={saveEdit} />}
    </div>
  );
}
