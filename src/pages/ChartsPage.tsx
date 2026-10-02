import { BarChart3, CalendarRange } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyAnalytics, Settings } from "../../shared/schemas";
import { api } from "../api";
import { EmptyState } from "../components/EmptyState";
import { quarterDates, rangeDates, shortDate } from "../utils";

type RangeKey = "7d" | "30d" | "quarter" | "custom";

export function ChartsPage() {
  const initial = rangeDates(30);
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [data, setData] = useState<DailyAnalytics[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const load = useCallback(async () => { const [rows, nextSettings] = await Promise.all([api.getAnalytics(start, end), api.getSettings()]); setData(rows.map((row) => ({ ...row, date: row.date }))); setSettings(nextSettings); }, [start, end]);
  useEffect(() => { void load(); }, [load]);

  function selectRange(key: RangeKey) {
    setRangeKey(key);
    if (key === "7d" || key === "30d") { const range = rangeDates(key === "7d" ? 7 : 30); setStart(range.start); setEnd(range.end); }
    if (key === "quarter") { const range = quarterDates(); setStart(range.start); setEnd(range.end); }
  }
  const hasAnyData = data.some((row) => row.weight !== null || row.calories > 0);
  const tick = (value: string) => shortDate(value);
  const tooltipLabel = (value: unknown) => typeof value === "string" ? shortDate(value) : "";

  return (
    <div className="page charts-page">
      <header className="page-header"><div><p className="eyebrow">Trends over time</p><h1>Charts</h1></div><span className="metric-icon violet"><BarChart3 size={21} /></span></header>
      <div className="range-tabs">{(["7d", "30d", "quarter", "custom"] as RangeKey[]).map((key) => <button key={key} className={rangeKey === key ? "active" : ""} onClick={() => selectRange(key)}>{key === "quarter" ? "Quarter" : key === "custom" ? "Custom" : key.toUpperCase()}</button>)}</div>
      {rangeKey === "custom" && <div className="custom-range"><label><span>From</span><input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label><label><span>To</span><input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></label></div>}

      {!hasAnyData ? <EmptyState icon={CalendarRange} title="Your trends will appear here" detail="Add a few weights and meals to see how your numbers move over time." /> : <>
        <section className="chart-card"><div className="chart-heading"><div><p className="eyebrow">Pounds</p><h2>Weight</h2></div>{settings?.goalWeight && <span>{settings.goalWeight} lb goal</span>}</div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="date" tickFormatter={tick} tickLine={false} axisLine={false} minTickGap={24} /><YAxis domain={["dataMin - 2", "dataMax + 2"]} tickLine={false} axisLine={false} width={36} /><Tooltip labelFormatter={tooltipLabel} />{settings?.goalWeight && <ReferenceLine y={settings.goalWeight} stroke="#3478f6" strokeDasharray="5 5" ifOverflow="extendDomain" />}<Line type="monotone" dataKey="weight" name="Weight" stroke="#3478f6" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} /></LineChart></ResponsiveContainer></div></section>
        <section className="chart-card"><div className="chart-heading"><div><p className="eyebrow">Daily total</p><h2>Calories</h2></div>{settings?.calorieGoal && <span>{Math.round(settings.calorieGoal)} goal</span>}</div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="date" tickFormatter={tick} tickLine={false} axisLine={false} minTickGap={24} /><YAxis tickLine={false} axisLine={false} width={42} /><Tooltip labelFormatter={tooltipLabel} />{settings?.calorieGoal && <ReferenceLine y={settings.calorieGoal} stroke="#ff6259" strokeDasharray="5 5" ifOverflow="extendDomain" />}<Bar dataKey="calories" name="Calories" fill="#ff6259" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
        <section className="chart-card"><div className="chart-heading"><div><p className="eyebrow">Grams per day</p><h2>Macros</h2></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="date" tickFormatter={tick} tickLine={false} axisLine={false} minTickGap={24} /><YAxis tickLine={false} axisLine={false} width={36} /><Tooltip labelFormatter={tooltipLabel} /><Legend />{settings?.proteinGoal && <ReferenceLine y={settings.proteinGoal} stroke="#20b276" strokeDasharray="5 5" ifOverflow="extendDomain" />}<Line type="monotone" dataKey="proteinGrams" name="Protein" stroke="#20b276" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="carbsGrams" name="Carbs" stroke="#3478f6" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="fatGrams" name="Fat" stroke="#f5a524" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div></section>
      </>}
    </div>
  );
}
