import { ArrowUpRight, CircleDot, RotateCcw } from "lucide-react";
import { useState } from "react";
import { DEFAULT_PARAMS, MIN_ATTENDANCE_PERCENT, type Model } from "../domain/model";
import type { Parameters } from "../domain/types";

export type RulesProps = { params: Parameters; setParams: (p: Parameters) => void; model: Model };

const ORG = "https://github.com/urep-student-attendance";

export function Brief({ inApp, rules }: { inApp?: boolean; rules: RulesProps }) {
  return (
    <div className={`brief${inApp ? " in-app" : ""}`}>
      <p className="brief-eyebrow">UREP 32 · Student attendance</p>
      <h1>Student app, web preview</h1>
      <p className="brief-lede">
        The mobile app students will use to see their attendance from the PALM readers.{" "}
        {inApp ? "It" : "Try it on the right. It"} runs on demo data until the attendance API is hosted.
      </p>
      <ul className="brief-meta">
        <li>Mobile app lead: Alireza Afshan</li>
        <li>Build {__BUILD_SHA__}</li>
        <li>Fictional demo student</li>
      </ul>

      <section className="brief-section" aria-labelledby="rules-h">
        <h2 id="rules-h">Attendance rules</h2>
        <p>
          These are the two parameters from the attendance design. Change them and the app recalculates every class.
        </p>
        <RulesPlayground {...rules} compact={inApp} />
      </section>

      <section className="brief-section" aria-labelledby="flow-h">
        <h2 id="flow-h">How a scan reaches the app</h2>
        <p>Each step matches a table and endpoint in the attendance API prototype.</p>
        <ol className="flow">
          <li>
            <span className="flow-num">1</span>
            <div className="flow-body">
              <strong>
                PALM reader <span className="tag">Device setup in progress</span>
              </strong>
              <p>The student scans. The reader sends its device ID, the palm and a timestamp.</p>
            </div>
          </li>
          <li>
            <span className="flow-num">2</span>
            <div className="flow-body">
              <strong>
                <code>time_log</code> <span className="tag is-done">API prototype</span>
              </strong>
              <p>The raw scan is stored exactly as received.</p>
            </div>
          </li>
          <li>
            <span className="flow-num">3</span>
            <div className="flow-body">
              <strong>
                <code>time_log_mapping</code> <span className="tag is-done">API prototype</span>
              </strong>
              <p>Palm becomes a student ID and the reader becomes a room. Unknown palms or readers stay unmapped.</p>
            </div>
          </li>
          <li>
            <span className="flow-num">4</span>
            <div className="flow-body">
              <strong>
                <code>student_attendance</code> <span className="tag is-done">API prototype</span>
              </strong>
              <p>
                Each registered student gets one row per lecture: present or absent, the scan used, late minutes and
                a reason.
              </p>
            </div>
          </li>
          <li className="is-here">
            <span className="flow-num">5</span>
            <div className="flow-body">
              <strong>
                Student app <span className="tag is-here">This preview</span>
              </strong>
              <p>Shows today's classes, attendance per course, and why each scan did or didn't count.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="brief-section" aria-labelledby="data-h">
        <h2 id="data-h">Data the app needs</h2>
        <p>What students see, and where it comes from, for the database design.</p>
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Shown in the app</th>
              <th scope="col">Source</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Status, scan time, late minutes, reason</td>
              <td>
                <code>student_attendance</code>
              </td>
              <td>
                <span className="tag is-done">In schema</span>
              </td>
            </tr>
            <tr>
              <td>Every scan and its room</td>
              <td>
                <code>time_log</code>, <code>time_log_mapping</code>
              </td>
              <td>
                <span className="tag is-done">In schema</span>
              </td>
            </tr>
            <tr>
              <td>Palm registration date</td>
              <td>
                <code>palm_reg.created_at</code>
              </td>
              <td>
                <span className="tag is-done">In schema</span>
              </td>
            </tr>
            <tr>
              <td>Why a scan didn't count</td>
              <td>Computed from mapping + rules</td>
              <td>
                <span className="tag is-new">New endpoint</span>
              </td>
            </tr>
            <tr>
              <td>Course title, instructor, meeting days</td>
              <td>SIS → <code>courses</code>, <code>schedule</code></td>
              <td>
                <span className="tag is-new">New columns</span>
              </td>
            </tr>
            <tr>
              <td>Student name and program</td>
              <td>SIS</td>
              <td>
                <span className="tag is-new">New</span>
              </td>
            </tr>
            <tr>
              <td>Minimum attendance ({MIN_ATTENDANCE_PERCENT}%)</td>
              <td>
                <code>parameters</code>
              </td>
              <td>
                <span className="tag is-new">Proposed</span>
              </td>
            </tr>
            <tr>
              <td>Student sign-in</td>
              <td>University accounts</td>
              <td>
                <span className="tag">To decide</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="brief-section" aria-labelledby="next-h">
        <h2 id="next-h">Next</h2>
        <ul className="next">
          <li>
            <CircleDot aria-hidden />
            <span>
              <strong>Connect to the attendance API</strong> once it's hosted, replacing the demo data.
            </span>
          </li>
          <li>
            <CircleDot aria-hidden />
            <span>
              <strong>Palm registration</strong> with the device team, using the X-Telcom Android SDK.
            </span>
          </li>
          <li>
            <CircleDot aria-hidden />
            <span>
              <strong>Instructor view</strong> for live class lists and attendance corrections.
            </span>
          </li>
          <li>
            <CircleDot aria-hidden />
            <span>
              <strong>Store release</strong> for iOS and Android from this same codebase.
            </span>
          </li>
        </ul>
      </section>

      <footer className="brief-foot">
        <p>
          <a href={`${ORG}/mobile-app`}>
            App source <ArrowUpRight size={13} aria-hidden />
          </a>{" "}
          ·{" "}
          <a href={`${ORG}/attendance-api`}>
            Attendance API prototype <ArrowUpRight size={13} aria-hidden />
          </a>
        </p>
        <p>The student, instructors, rooms and scans in this preview are fictional. All times are Doha time.</p>
      </footer>
    </div>
  );
}

function RulesPlayground({ params, setParams, model, compact }: RulesProps & { compact?: boolean }) {
  const [lastAfter, setLastAfter] = useState(params.after ?? DEFAULT_PARAMS.after!);
  const isDefault = params.before === DEFAULT_PARAMS.before && params.after === DEFAULT_PARAMS.after;
  const lowest = model.sections
    .filter((s) => s.stats.rate !== null)
    .sort((a, b) => a.stats.rate! - b.stats.rate!)[0];

  return (
    <div className="playground">
      <div className="control">
        <label htmlFor="before">
          Scanning opens before start <code>Time_before_lecture_start</code>
        </label>
        <output htmlFor="before" className="num">
          {params.before} min
        </output>
        <input
          id="before"
          type="range"
          min={0}
          max={30}
          step={1}
          value={params.before}
          onChange={(e) => setParams({ ...params, before: Number(e.target.value) })}
        />
      </div>
      <div className="control">
        <label htmlFor="after">
          Late cutoff after start <code>Time_after_lecture_start</code>
        </label>
        <output htmlFor="after" className="num">
          {params.after === null ? "null" : `${params.after} min`}
        </output>
        <input
          id="after"
          type="range"
          min={0}
          max={60}
          step={1}
          value={params.after ?? lastAfter}
          disabled={params.after === null}
          onChange={(e) => {
            const after = Number(e.target.value);
            setLastAfter(after);
            setParams({ ...params, after });
          }}
        />
        <label className="check">
          <input
            type="checkbox"
            checked={params.after === null}
            onChange={(e) => setParams({ ...params, after: e.target.checked ? null : lastAfter })}
          />
          No cutoff: accept late scans until class ends and record minutes late
        </label>
      </div>

      <Timeline params={params} compact={compact} />

      <div className="result" role="status">
        <span>
          Demo student: <strong className="num">{model.overall.rate}%</strong> overall
          {lowest && (
            <>
              , lowest <strong className="num">{lowest.stats.rate}%</strong> in {lowest.code}
            </>
          )}
        </span>
        <button
          className="text-button"
          type="button"
          disabled={isDefault}
          onClick={() => {
            setLastAfter(DEFAULT_PARAMS.after!);
            setParams(DEFAULT_PARAMS);
          }}
        >
          <RotateCcw aria-hidden /> Defaults
        </button>
      </div>
    </div>
  );
}

/** A 75-minute class on a -30…+80 minute axis. */
function Timeline({ params, compact }: { params: Parameters; compact?: boolean }) {
  const W = compact ? 330 : 480;
  const pad = 8;
  const min = -30;
  const max = 85;
  const end = 75;
  const x = (m: number) => pad + ((Math.max(min, Math.min(max, m)) - min) / (max - min)) * (W - 2 * pad);
  const cutoff = params.after === null ? end : Math.min(params.after, max);
  const y = 26;
  const h = 18;
  const ticks = [
    { m: -params.before, label: `−${params.before}` },
    { m: 0, label: "Start" },
    ...(params.after !== null && params.after !== 0 && params.after < end - 6
      ? [{ m: params.after, label: `+${params.after}` }]
      : []),
    { m: end, label: "End" },
  ];
  return (
    <div className="timeline">
      <svg viewBox={`0 0 ${W} 74`} role="img" aria-label={describe(params)}>
        <rect x={x(min)} y={y} width={x(max) - x(min)} height={h} rx={6} style={{ fill: "var(--absent-soft)" }} />
        <rect x={x(-params.before)} y={y} width={x(0) - x(-params.before)} height={h} style={{ fill: "var(--present)" }} />
        {cutoff > 0 && (
          <rect x={x(0)} y={y} width={x(cutoff) - x(0)} height={h} style={{ fill: "var(--late)", opacity: 0.85 }} />
        )}
        <rect x={x(0)} y={y - 8} width={x(end) - x(0)} height={4} rx={2} style={{ fill: "var(--ink)", opacity: 0.25 }} />
        <text x={x(0)} y={y - 12} style={{ fill: "var(--ink-3)", fontSize: 11, fontWeight: 700 }}>
          Class (75 min)
        </text>
        {ticks.map((t) => (
          <g key={t.label}>
            <line x1={x(t.m)} x2={x(t.m)} y1={y - 2} y2={y + h + 6} style={{ stroke: "var(--ink)", strokeWidth: 1.5 }} />
            <text
              x={x(t.m)}
              y={y + h + 20}
              textAnchor="middle"
              style={{ fill: "var(--ink-2)", fontSize: 11.5, fontWeight: 700 }}
            >
              {t.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="legend" aria-hidden>
        <span>
          <i style={{ background: "var(--present)" }} /> On time
        </span>
        <span>
          <i style={{ background: "var(--late)" }} /> Late, still counted
        </span>
        <span>
          <i style={{ background: "var(--absent-soft)", outline: "1px solid var(--line-strong)" }} /> Not counted
        </span>
      </div>
    </div>
  );
}

function describe(p: Parameters) {
  return p.after === null
    ? `Scans count from ${p.before} minutes before start until the class ends; late minutes are recorded.`
    : `Scans count from ${p.before} minutes before start to ${p.after} minutes after start.`;
}
