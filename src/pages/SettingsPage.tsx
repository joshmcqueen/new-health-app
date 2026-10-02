import { zodResolver } from "@hookform/resolvers/zod";
import { Database, RotateCcw, Scale, Settings as SettingsIcon, Sparkles, Target, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { Settings } from "../../shared/schemas";
import { DEFAULT_SETTINGS, settingsSchema } from "../../shared/schemas";
import { api } from "../api";
import { Modal } from "../components/Modal";
import { localDate } from "../utils";

export function SettingsPage() {
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: DEFAULT_SETTINGS,
  });
  const nullableNumber = { setValueAs: (value: string) => value === "" ? null : Number(value) };

  useEffect(() => {
    void api.getSettings().then(reset).catch((error: Error) => setMessage({ tone: "error", text: error.message }));
  }, [reset]);

  async function seed() {
    setMessage(null);
    setSeeding(true);
    try {
      const result = await api.seedSampleData(localDate());
      setMessage({ tone: "success", text: `Added ${result.days} days, ${result.meals} meals, ${result.weights} weights, and ${result.foods} reusable foods.` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not add sample data." });
    } finally {
      setSeeding(false);
    }
  }

  async function clear() {
    setClearing(true);
    try {
      const defaults = await api.clearAllData();
      reset(defaults);
      setClearOpen(false);
      setMessage({ tone: "success", text: "All tracker data was cleared and your goals were restored to the defaults." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not clear your data." });
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="page settings-page">
      <header className="page-header"><div><p className="eyebrow">Make it yours</p><h1>Settings</h1></div><span className="metric-icon blue"><SettingsIcon size={21} /></span></header>
      <p className="page-lede">Set your targets and manage local development data. Everything here stays in this app’s SQLite database.</p>

      {message && <div className={`settings-message ${message.tone}`} role="status">{message.text}</div>}

      <section className="settings-card">
        <div className="settings-card-heading"><span className="metric-icon blue"><Target size={20} /></span><div><p className="eyebrow">Current targets</p><h2>Health goals</h2></div></div>
        <form className="form-stack" onSubmit={handleSubmit(async (value) => {
          setMessage(null);
          try {
            const saved = await api.updateSettings(value);
            reset(saved);
            setMessage({ tone: "success", text: "Your goals were saved." });
          } catch (error) {
            setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not save your goals." });
          }
        })}>
          <p className="form-intro">These current goals appear on Today and across your historical charts. Leave a field empty to hide that target.</p>
          <label><span>Goal weight</span><div className="input-suffix"><input type="number" step="0.1" inputMode="decimal" placeholder="160" {...register("goalWeight", nullableNumber)} /><b>lb</b></div>{errors.goalWeight && <small>{errors.goalWeight.message}</small>}</label>
          <div className="macro-form-grid">
            <label><span>Calories</span><input type="number" inputMode="numeric" placeholder="2000" {...register("calorieGoal", nullableNumber)} /></label>
            <label><span>Protein</span><div className="input-suffix"><input type="number" inputMode="decimal" placeholder="160" {...register("proteinGoal", nullableNumber)} /><b>g</b></div></label>
            <label><span>Carbs</span><div className="input-suffix"><input type="number" inputMode="decimal" placeholder="200" {...register("carbsGoal", nullableNumber)} /><b>g</b></div></label>
            <label><span>Fat</span><div className="input-suffix"><input type="number" inputMode="decimal" placeholder="65" {...register("fatGoal", nullableNumber)} /><b>g</b></div></label>
          </div>
          <input type="hidden" {...register("timezone")} />
          <button className="primary-button" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save goals"}</button>
        </form>
      </section>

      <section className="settings-card">
        <div className="settings-card-heading"><span className="metric-icon violet"><Database size={20} /></span><div><p className="eyebrow">Development tools</p><h2>Sample data</h2></div></div>
        <p className="settings-copy">Add a realistic week ending today: daily weights plus breakfast, lunch, dinner, healthy snacks, and a few reusable foods. This only works when the tracker is empty.</p>
        <button className="settings-action" type="button" onClick={() => void seed()} disabled={seeding}><Sparkles size={19} /><span><b>{seeding ? "Adding sample week…" : "Seed one week of data"}</b><small>Nothing is added until you tap</small></span></button>
      </section>

      <section className="settings-card danger-zone">
        <div className="settings-card-heading"><span className="metric-icon danger-icon"><Trash2 size={20} /></span><div><p className="eyebrow">Danger zone</p><h2>Start fresh</h2></div></div>
        <p className="settings-copy">Permanently remove every weight, meal, and saved food, rebuild the local schema, then restore the default goals.</p>
        <button className="danger-button" type="button" onClick={() => setClearOpen(true)}><RotateCcw size={18} />Clear all data</button>
      </section>

      {clearOpen && <Modal title="Clear all data?" eyebrow="This cannot be undone" onClose={() => setClearOpen(false)}>
        <div className="confirm-stack"><span className="confirm-icon"><Scale size={25} /></span><p>This permanently deletes all weights, meals, and saved foods from the local database. Your goals will return to 160 lb, 2,000 calories, 160g protein, 200g carbs, and 65g fat.</p><button className="danger-button solid" type="button" onClick={() => void clear()} disabled={clearing}>{clearing ? "Clearing…" : "Yes, clear everything"}</button><button className="secondary-button" type="button" onClick={() => setClearOpen(false)} disabled={clearing}>Cancel</button></div>
      </Modal>}
    </div>
  );
}
