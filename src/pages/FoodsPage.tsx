import { MoreHorizontal, Plus, Search, Sparkles, Trash2, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { NutritionFields, QuickFood } from "../../shared/schemas";
import { api } from "../api";
import { AiCapture } from "../components/AiCapture";
import { EmptyState } from "../components/EmptyState";
import { NutritionModal } from "../components/Forms";
import { AiDetails, MacroRow } from "../components/Nutrition";

export function FoodsPage() {
  const [foods, setFoods] = useState<QuickFood[]>([]);
  const [query, setQuery] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [editing, setEditing] = useState<QuickFood | "new" | null>(null);
  const load = useCallback(async () => setFoods(await api.getFoods()), []);
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => foods.filter((food) => `${food.name} ${food.description}`.toLowerCase().includes(query.toLowerCase())), [foods, query]);

  async function save(value: NutritionFields) {
    if (editing && editing !== "new") await api.updateFood(editing.id, value);
    else await api.createFood(value);
    await load();
  }

  async function remove(food: QuickFood) {
    if (!window.confirm(`Delete “${food.name}”? Existing meal entries will be kept.`)) return;
    await api.deleteFood(food.id);
    await load();
  }

  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">Reusable portions</p><h1>Foods</h1></div><button className="round-add" onClick={() => setEditing("new")}><Plus size={21} /></button></header>
      <p className="page-lede">Keep the handful of meals you eat often, then log them in a tap.</p>
      <div className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search quick foods" /></div>
      <button className="ai-banner" onClick={() => setAiOpen(true)}><span><Sparkles size={20} /></span><div><b>Create a quick food with OpenAI</b><small>Use a description, voice, photos, or nutrition labels</small></div><span className="banner-arrow">›</span></button>

      {filtered.length === 0 ? <EmptyState icon={UtensilsCrossed} title={foods.length ? "No matches" : "Build your quick-food shelf"} detail={foods.length ? "Try a different search." : "Save a normal portion once, then reuse it whenever you eat it."} action={!foods.length && <button className="secondary-button" onClick={() => setAiOpen(true)}><Sparkles size={17} />Create with AI</button>} /> : <div className="food-grid">{filtered.map((food) => <article className="food-card" key={food.id}><div className="food-card-top"><div className="metric-icon food-accent"><UtensilsCrossed size={19} /></div><button className="icon-button compact" onClick={() => setEditing(food)} aria-label={`Edit ${food.name}`}><MoreHorizontal size={20} /></button></div><h2>{food.name}</h2>{food.description && <p>{food.description}</p>}<MacroRow item={food} /><AiDetails metadata={food.aiMetadata} /><div className="food-actions"><button onClick={() => setEditing(food)}>Edit</button><button className="danger-text" onClick={() => void remove(food)}><Trash2 size={15} />Delete</button></div></article>)}</div>}

      {aiOpen && <AiCapture mode="quick_food" onClose={() => setAiOpen(false)} onSaved={() => void load()} />}
      {editing && <NutritionModal title={editing === "new" ? "Add quick food" : "Edit quick food"} initial={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}
