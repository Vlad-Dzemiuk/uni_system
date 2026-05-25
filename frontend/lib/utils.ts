import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "2-digit" }
) {
  const trimmed = iso.trim();
  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z)?$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
    return new Intl.DateTimeFormat("uk-UA", options).format(date);
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;

  return new Intl.DateTimeFormat("uk-UA", options).format(date);
}
