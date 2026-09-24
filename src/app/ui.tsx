import { Check, CircleDashed, Clock3, ScanLine, X } from "lucide-react";
import type { ReactNode } from "react";
import type { LectureStatus, LectureView, Model } from "../domain/model";
import { formatTime } from "../domain/time";

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export function ScreenHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <header className="screen-head">
      <div>
        {sub && <p className="sub">{sub}</p>}
        <h1>{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function StatusChip({ view }: { view: LectureView }) {
  const { status, lateBy } = view;
  const map: Record<LectureStatus, { icon: ReactNode; label: string }> = {
    present: { icon: <Check aria-hidden />, label: "Present" },
    late: { icon: <Clock3 aria-hidden />, label: `Late ${lateBy} min` },
    absent: { icon: <X aria-hidden />, label: "Absent" },
    upcoming: { icon: <CircleDashed aria-hidden />, label: "Upcoming" },
    open: { icon: <ScanLine aria-hidden />, label: "Scan now" },
  };
  const { icon, label } = map[status];
  return (
    <span className={`chip chip-${status}`}>
      {icon}
      {label}
    </span>
  );
}

export function Ring({
  value,
  size = 96,
  low,
  onBrand,
}: {
  value: number | null;
  size?: number;
  low?: boolean;
  /** drawn on the UDST blue panel */
  onBrand?: boolean;
}) {
  const track = onBrand ? "rgb(255 255 255 / 0.22)" : "var(--muted-soft)";
  const fill = onBrand ? (low ? "var(--absent-on-brand)" : "#ffffff") : low ? "var(--absent)" : "var(--present)";
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value ?? 0;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} style={{ stroke: track }} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          style={{ stroke: fill }}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
        />
      </svg>
      <div className="ring-value">
        <div>
          <strong className="num">{value === null ? "—" : `${value}%`}</strong>
          <span>attended</span>
        </div>
      </div>
    </div>
  );
}

export function AttendanceBar({ rate, min }: { rate: number | null; min: number }) {
  return (
    <div className="bar" role="img" aria-label={`${rate ?? 0}% attended, minimum ${min}%`}>
      <div className={`bar-fill${rate !== null && rate < min ? " is-low" : ""}`} style={{ width: `${rate ?? 0}%` }} />
      <div className="bar-mark" style={{ left: `calc(${min}% - 1px)` }} />
    </div>
  );
}

/** Why a class was marked absent, in the student's terms. */
export function absentDetail(view: LectureView, model: Model): string {
  const scan = view.rejected;
  if (!scan) return `No scan between ${formatTime(view.windowStart)} and ${formatTime(view.windowEnd)}`;
  const at = formatTime(scan.log.time);
  switch (scan.outcome.kind) {
    case "too_late":
      return `Scanned ${at}, ${scan.outcome.minutes} min after start (limit ${model.params.after} min)`;
    case "too_early":
      return `Scanned ${at}, before scanning opened at ${formatTime(view.windowStart)}`;
    case "wrong_room": {
      const room = scan.roomId !== null ? model.roomById.get(scan.roomId)?.room : "another room";
      return `Scanned ${at} in room ${room}, not ${view.section.room.room}`;
    }
    default:
      return "No valid scan in the window";
  }
}
