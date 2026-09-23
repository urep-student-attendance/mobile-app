// Qatar has no daylight saving time, so Asia/Qatar is a fixed UTC+3.
export const DOHA_OFFSET_MS = 3 * 60 * 60 * 1000;
export const MINUTE = 60 * 1000;
export const DAY = 24 * 60 * MINUTE;
export const TIME_ZONE = "Asia/Qatar";

/** Epoch ms for a Doha wall-clock date ("2026-09-23") and time ("09:00"). */
export function dohaInstant(date: string, time: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - DOHA_OFFSET_MS;
}

/** Doha calendar date ("2026-09-23") for an instant. */
export function dohaDate(ms: number): string {
  return new Date(ms + DOHA_OFFSET_MS).toISOString().slice(0, 10);
}

/** Doha weekday, 0 = Sunday. */
export function dohaWeekday(ms: number): number {
  return new Date(ms + DOHA_OFFSET_MS).getUTCDay();
}

export function addDays(date: string, days: number): string {
  return dohaDate(dohaInstant(date, "12:00") + days * DAY);
}

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const dayFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});
const longDayFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const clockFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: false,
});

/** "9:05 am" */
export const formatTime = (ms: number) => timeFmt.format(ms).replace(/\u202f/g, " ");
/** "Wed 23 Sep" */
export const formatDay = (ms: number) => dayFmt.format(ms).replace(",", "");
/** "Wednesday 23 September" */
export const formatLongDay = (ms: number) => longDayFmt.format(ms).replace(",", "");
/** "13:05" */
export const formatClock = (ms: number) => clockFmt.format(ms);

/** "9:00–10:15 am" or "11:00 am–12:15 pm" from wall-clock strings. */
export function formatRange(start: string, end: string): string {
  const a = wall(start);
  const b = wall(end);
  return a.suffix === b.suffix ? `${a.text}–${b.text} ${b.suffix}` : `${a.text} ${a.suffix}–${b.text} ${b.suffix}`;
}

function wall(t: string): { text: string; suffix: string } {
  const [h, m] = t.split(":").map(Number);
  return { text: `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}`, suffix: h < 12 ? "am" : "pm" };
}

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "in 12 min", "in 1 h 5 min" */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / MINUTE));
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
