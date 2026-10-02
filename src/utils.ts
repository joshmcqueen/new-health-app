import type { MealType } from "../shared/schemas";

export function localDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

export function dateLabel(value: string, options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }) {
  return new Intl.DateTimeFormat("en-US", options).format(new Date(`${value}T12:00:00`));
}

export function shortDate(value: string) {
  return dateLabel(value, { month: "short", day: "numeric" });
}

export function mealTypeNow(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 20) return "dinner";
  return "snack";
}

export function localDateTime(date: string) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
  return `${date}T${time}`;
}

export function rangeDates(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  return { start: localDate(start), end: localDate(end) };
}

export function quarterDates() {
  const now = new Date();
  const month = Math.floor(now.getMonth() / 3) * 3;
  return { start: localDate(new Date(now.getFullYear(), month, 1)), end: localDate(now) };
}

export const rounded = (value: number) => Math.round(value);
