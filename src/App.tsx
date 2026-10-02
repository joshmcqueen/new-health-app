import { BarChart3, BookOpen, CalendarDays, Home, Utensils } from "lucide-react";
import { lazy, Suspense } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";

const TodayPage = lazy(() => import("./pages/TodayPage").then((module) => ({ default: module.TodayPage })));
const LogPage = lazy(() => import("./pages/LogPage").then((module) => ({ default: module.LogPage })));
const FoodsPage = lazy(() => import("./pages/FoodsPage").then((module) => ({ default: module.FoodsPage })));
const ChartsPage = lazy(() => import("./pages/ChartsPage").then((module) => ({ default: module.ChartsPage })));

const tabs = [
  { to: "/today", label: "Today", icon: Home },
  { to: "/log", label: "Log", icon: CalendarDays },
  { to: "/foods", label: "Foods", icon: Utensils },
  { to: "/charts", label: "Charts", icon: BarChart3 },
];

export function App() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Suspense fallback={<div className="route-loading">Loading…</div>}>
          <Routes>
            <Route path="/today" element={<TodayPage />} />
            <Route path="/log" element={<LogPage />} />
            <Route path="/foods" element={<FoodsPage />} />
            <Route path="/charts" element={<ChartsPage />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Routes>
        </Suspense>
      </main>
      <nav className="tab-bar" aria-label="Primary">
        {tabs.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? "active" : ""}><Icon size={22} strokeWidth={2.2} /><span>{label}</span></NavLink>)}
      </nav>
      <div className="desktop-brand"><span><BookOpen size={18} /></span><b>Health Tracker</b><small>Private daily health journal</small></div>
    </div>
  );
}
