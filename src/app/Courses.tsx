import { ChevronLeft, MapPin, UserRound } from "lucide-react";
import { useState } from "react";
import { MIN_ATTENDANCE_PERCENT, type LectureView, type Model, type SectionView } from "../domain/model";
import { formatDay, formatRange, formatTime, WEEKDAY_SHORT } from "../domain/time";
import { absentDetail, AttendanceBar, ScreenHead, StatusChip } from "./ui";

const isLow = (s: SectionView) => s.stats.rate !== null && s.stats.rate < MIN_ATTENDANCE_PERCENT;

function schedule(s: SectionView) {
  return `${s.section.days.map((d) => WEEKDAY_SHORT[d]).join(", ")} · ${formatRange(
    s.section.start_time,
    s.section.end_time,
  )}`;
}

export function Courses({ model }: { model: Model }) {
  return (
    <>
      <ScreenHead title="Courses" sub={`${model.semester.label} · ${model.sections.length} sections`} />
      <div className="stack">
        {model.sections.map((s) => (
          <a key={s.section.id} className="card course-card link-card" href={`#/courses/${s.section.id}`}>
            <div>
              <div className="course-code">
                {s.code} · Section {s.section.section}
              </div>
              <h2 className="course-name">{s.course.title}</h2>
            </div>
            <div className="course-rate">
              <strong className="num" style={isLow(s) ? { color: "var(--absent)" } : undefined}>
                {s.stats.rate ?? "—"}
                {s.stats.rate !== null && "%"}
              </strong>
              <span>attended</span>
            </div>
            <div className="meta">
              <span>{schedule(s)}</span>
              <span>
                <MapPin aria-hidden /> {s.room.room}
              </span>
            </div>
            <div className="course-foot">
              <AttendanceBar rate={s.stats.rate} min={MIN_ATTENDANCE_PERCENT} />
              <div className="course-counts">
                <span>
                  {s.stats.missed} missed · {s.stats.late} late
                </span>
                {isLow(s) ? (
                  <span className="flag">Below {MIN_ATTENDANCE_PERCENT}%</span>
                ) : (
                  <span>{s.stats.remaining} classes left</span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}

export function CourseDetail({ model, sectionId }: { model: Model; sectionId: number }) {
  const s = model.sections.find((x) => x.section.id === sectionId);
  const [tab, setTab] = useState<"past" | "upcoming">("past");
  if (!s) {
    return (
      <>
        <a className="back" href="#/courses">
          <ChevronLeft size={20} aria-hidden /> Courses
        </a>
        <div className="card empty" style={{ marginTop: 16 }}>
          <p>This course isn't in your schedule.</p>
        </div>
      </>
    );
  }
  const allowed = s.stats.absencesLeft + s.stats.missed;
  const past = s.lectures.filter((v) => v.status !== "upcoming").reverse();
  const upcoming = s.lectures.filter((v) => v.status === "upcoming");
  const shown = tab === "past" ? past : upcoming;

  return (
    <>
      <a className="back" href="#/courses">
        <ChevronLeft size={20} aria-hidden /> Courses
      </a>
      <div className="detail-head">
        <ScreenHead title={s.course.title} sub={`${s.code} · Section ${s.section.section}`} />
      </div>
      <div className="meta" style={{ margin: "-8px 2px 16px" }}>
        <span>{schedule(s)}</span>
        <span>
          <MapPin aria-hidden /> {s.room.room}
        </span>
        <span>
          <UserRound aria-hidden /> {s.section.instructor}
        </span>
      </div>

      <div className="tiles">
        <div className="tile">
          <strong className="num" style={isLow(s) ? { color: "var(--absent)" } : undefined}>
            {s.stats.rate ?? "—"}
            {s.stats.rate !== null && "%"}
          </strong>
          <span>Attended</span>
        </div>
        <div className="tile">
          <strong className="num">{s.stats.attended}</strong>
          <span>Present</span>
        </div>
        <div className="tile">
          <strong className="num">{s.stats.late}</strong>
          <span>Late</span>
        </div>
        <div className="tile">
          <strong className="num">{s.stats.missed}</strong>
          <span>Missed</span>
        </div>
      </div>

      <div className="card budget">
        <p>
          {s.stats.absencesLeft > 0
            ? `You can miss ${s.stats.absencesLeft} more class${s.stats.absencesLeft === 1 ? "" : "es"} this semester.`
            : "You have used all allowed absences for this course."}
        </p>
        <small>
          Limit: {allowed} of {s.stats.total} classes (to stay at {MIN_ATTENDANCE_PERCENT}% or above). Used{" "}
          {s.stats.missed}.
        </small>
        <div className="pips" aria-hidden>
          {Array.from({ length: Math.max(allowed, s.stats.missed) }, (_, i) => (
            <span key={i} className={`pip${i < s.stats.missed ? " is-used" : ""}`} />
          ))}
        </div>
      </div>

      <div className="segmented" role="group" aria-label="Classes">
        <button aria-pressed={tab === "past"} onClick={() => setTab("past")}>
          So far ({past.length})
        </button>
        <button aria-pressed={tab === "upcoming"} onClick={() => setTab("upcoming")}>
          Upcoming ({upcoming.length})
        </button>
      </div>

      <div className="list">
        {shown.map((v) => (
          <LectureRow key={v.lecture.id} view={v} model={model} />
        ))}
      </div>
    </>
  );
}

function LectureRow({ view, model }: { view: LectureView; model: Model }) {
  const { params } = model;
  const { lecture, status, row } = view;
  let detail: string;
  switch (status) {
    case "present":
      detail = `Scanned ${formatTime(row!.scan_time!)}`;
      break;
    case "late":
      detail =
        params.after === null
          ? `Scanned ${formatTime(row!.scan_time!)} · ${view.lateBy} late minutes recorded`
          : `Scanned ${formatTime(row!.scan_time!)} · inside the ${params.after} min limit`;
      break;
    case "absent":
      detail = absentDetail(view, model);
      break;
    case "open":
      detail = `Scan window open until ${formatTime(view.windowEnd)}`;
      break;
    default:
      detail = `${formatRange(lecture.start_time, lecture.end_time)} · scanning opens ${formatTime(view.windowStart)}`;
  }
  return (
    <div className="row">
      <span className="row-title">{formatDay(lecture.start)}</span>
      <StatusChip view={view} />
      <span className="row-detail">{detail}</span>
    </div>
  );
}
