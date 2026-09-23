import { Check, Clock3, Copy, MapPinOff, ScanLine, Unlink, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Model } from "../domain/model";
import type { ExplainedScan } from "../domain/pipeline";
import { dohaDate, formatDay, formatLongDay, formatTime } from "../domain/time";
import { ScreenHead } from "./ui";

type Filter = "all" | "counted" | "not";

export function Scans({ model }: { model: Model }) {
  const [filter, setFilter] = useState<Filter>("all");
  const scans = model.scans.filter((s) =>
    filter === "all" ? true : filter === "counted" ? s.outcome.kind === "counted" : s.outcome.kind !== "counted",
  );
  const groups = new Map<string, ExplainedScan[]>();
  for (const s of scans) {
    const day = dohaDate(s.log.time);
    groups.set(day, [...(groups.get(day) ?? []), s]);
  }
  const notCounted = model.scans.filter((s) => s.outcome.kind !== "counted").length;

  return (
    <>
      <ScreenHead title="Palm scans" sub={`${model.scans.length} scans recorded`} />
      <div className="filters" role="group" aria-label="Filter scans">
        {(
          [
            ["all", "All"],
            ["counted", "Counted"],
            ["not", `Not counted (${notCounted})`],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button key={key} className="filter" aria-pressed={filter === key} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>
      {[...groups.entries()].map(([day, list]) => (
        <section key={day}>
          <h2 className="section-title">{formatLongDay(list[0].log.time)}</h2>
          <div className="list">
            {list.map((s) => (
              <ScanRow key={s.log.id} scan={s} model={model} />
            ))}
          </div>
        </section>
      ))}
      {!scans.length && (
        <div className="card empty" style={{ marginTop: 16 }}>
          <p>No scans match this filter.</p>
        </div>
      )}
    </>
  );
}

export function ScanRow({ scan, model, showDay }: { scan: ExplainedScan; model: Model; showDay?: boolean }) {
  const { outcome } = scan;
  const { params } = model;
  const lecture = "lectureId" in outcome ? model.lectureById.get(outcome.lectureId) : undefined;
  const code = lecture?.section.code ?? "";
  const room = scan.roomId !== null ? model.roomById.get(scan.roomId)?.room : undefined;

  let tone = "muted";
  let icon: ReactNode = <ScanLine aria-hidden />;
  let title = "";
  let detail = "";
  switch (outcome.kind) {
    case "counted":
      if (outcome.late > 0) {
        tone = "late";
        icon = <Clock3 aria-hidden />;
        title = `Counted for ${code}`;
        detail =
          params.after === null
            ? `${outcome.late} min late, recorded as late minutes`
            : `${outcome.late} min late, inside the ${params.after} min limit`;
      } else {
        tone = "present";
        icon = <Check aria-hidden />;
        title = `Counted for ${code}`;
        detail = "On time";
      }
      break;
    case "duplicate":
      icon = <Copy aria-hidden />;
      title = "Extra scan";
      detail = `An earlier scan already counted for ${code}`;
      break;
    case "too_early":
      tone = "absent";
      icon = <X aria-hidden />;
      title = "Too early";
      detail = `${outcome.minutes} min before ${code} started (scanning opens ${params.before} min before)`;
      break;
    case "too_late":
      tone = "absent";
      icon = <X aria-hidden />;
      title = "Too late";
      detail = `${outcome.minutes} min after ${code} started (limit ${params.after} min)`;
      break;
    case "wrong_room":
      tone = "absent";
      icon = <MapPinOff aria-hidden />;
      title = "Wrong room";
      detail = `${code} meets in ${lecture?.section.room.room}, not ${room}`;
      break;
    case "no_class":
      title = "No class at this time";
      detail = "The scan was saved but didn't match any of your classes";
      break;
    case "unmapped":
      tone = "absent";
      icon = <Unlink aria-hidden />;
      title = "Reader not linked to a room";
      detail = `Saved from ${scan.log.device_id}, but it can't count until staff link this reader to a room`;
      break;
  }

  return (
    <div className="scan">
      <span className={`scan-icon tone-${tone}`}>{icon}</span>
      <div>
        <div className="scan-title">{title}</div>
        <div className="scan-detail">{detail}</div>
      </div>
      <div className="scan-time">
        {formatTime(scan.log.time)}
        <span>{showDay ? formatDay(scan.log.time) : room ? `Room ${room}` : "No room"}</span>
      </div>
    </div>
  );
}
