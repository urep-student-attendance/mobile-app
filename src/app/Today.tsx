import { CalendarDays, MapPin, TriangleAlert, UserRound } from "lucide-react";
import { lecturesOn, MIN_ATTENDANCE_PERCENT, nextLecture, type LectureView, type Model } from "../domain/model";
import { dohaDate, formatDay, formatDuration, formatLongDay, formatTime } from "../domain/time";
import { ScanRow } from "./Scans";
import { absentDetail, initials, Ring, ScreenHead, StatusChip } from "./ui";

export function Today({ model }: { model: Model }) {
  const today = lecturesOn(model, dohaDate(model.now));
  const next = nextLecture(model);
  const { overall } = model;
  const atRisk = model.sections.filter(
    (s) => (s.stats.rate !== null && s.stats.rate < MIN_ATTENDANCE_PERCENT) || s.stats.absencesLeft <= 0,
  );

  return (
    <>
      <ScreenHead
        title="Today"
        sub={formatLongDay(model.now)}
        action={
          <a className="avatar" href="#/profile" aria-label="Profile">
            {initials(model.student.name)}
          </a>
        }
      />

      <a className="card summary link-card" href="#/courses">
        <Ring value={overall.rate} onBrand low={overall.rate !== null && overall.rate < MIN_ATTENDANCE_PERCENT} />
        <div>
          <dl className="summary-stats">
            <div>
              <dt>
                <i className="dot dot-present" />
                Attended
              </dt>
              <dd className="num">{overall.attended}</dd>
            </div>
            <div>
              <dt>
                <i className="dot dot-late" />
                of those, late
              </dt>
              <dd className="num">{overall.late}</dd>
            </div>
            <div>
              <dt>
                <i className="dot dot-absent" />
                Missed
              </dt>
              <dd className="num">{overall.missed}</dd>
            </div>
          </dl>
          <p className="summary-note">
            {model.semester.label} · {overall.counted} of {overall.total} classes so far
          </p>
        </div>
      </a>

      {atRisk.map((s) => (
        <a className="alert" key={s.section.id} href={`#/courses/${s.section.id}`}>
          <TriangleAlert size={18} aria-hidden />
          <div>
            <strong>
              {s.code} is at {s.stats.rate}%
            </strong>
            <span>
              Below the {MIN_ATTENDANCE_PERCENT}% minimum.{" "}
              {s.stats.absencesLeft > 0
                ? `${s.stats.absencesLeft} more absence${s.stats.absencesLeft === 1 ? "" : "s"} allowed this semester.`
                : "No absences left this semester."}
            </span>
          </div>
        </a>
      ))}

      <h2 className="section-title">Classes today</h2>
      {today.length ? (
        <div className="stack">
          {today.map((v) => (
            <ClassCard key={v.lecture.id} view={v} model={model} />
          ))}
        </div>
      ) : (
        <div className="card empty">
          <CalendarDays size={26} aria-hidden />
          <strong style={{ marginTop: 6 }}>No classes today</strong>
          {next && (
            <p>
              Next: {next.section.code} on {formatDay(next.lecture.start)} at {formatTime(next.lecture.start)},
              room {next.section.room.room}
            </p>
          )}
        </div>
      )}

      <h2 className="section-title">
        Latest scans <a href="#/scans">See all</a>
      </h2>
      <div className="list">
        {model.scans.slice(0, 3).map((s) => (
          <ScanRow key={s.log.id} scan={s} model={model} showDay />
        ))}
      </div>
    </>
  );
}

function ClassCard({ view, model }: { view: LectureView; model: Model }) {
  const { now, params } = model;
  const { lecture, section, status, row } = view;
  const [startTime, startSuffix] = formatTime(lecture.start).split(" ");
  let line: string;
  switch (status) {
    case "upcoming":
      line = `Scanning opens ${formatTime(view.windowStart)}`;
      break;
    case "open":
      line =
        now < lecture.start
          ? `Class starts in ${formatDuration(lecture.start - now)}`
          : params.after === null
            ? `Late scans count until ${formatTime(view.windowEnd)}`
            : `Window closes in ${formatDuration(view.windowEnd - now)}`;
      break;
    case "present":
      line = `Scanned ${formatTime(row!.scan_time!)}`;
      break;
    case "late":
      line = `Scanned ${formatTime(row!.scan_time!)}`;
      break;
    case "absent":
      line = absentDetail(view, model);
      break;
  }
  return (
    <article className={`card class-card${status === "open" ? " is-open" : ""}`}>
      <div className="class-time">
        <strong>
          {startTime}
          <small> {startSuffix}</small>
        </strong>
        <span>{formatTime(lecture.end)}</span>
      </div>
      <div>
        <a href={`#/courses/${section.section.id}`} style={{ textDecoration: "none" }}>
          <h3 className="class-title">
            {section.code} <span>{section.course.title}</span>
          </h3>
        </a>
        <div className="meta">
          <span>
            <MapPin aria-hidden /> {section.room.room}
          </span>
          <span>
            <UserRound aria-hidden /> {section.section.instructor}
          </span>
        </div>
        <div className="class-status">
          <StatusChip view={view} />
          {status === "open" && <i className="pulse" style={{ color: "var(--accent)" }} aria-hidden />}
          <span>{line}</span>
        </div>
      </div>
    </article>
  );
}
