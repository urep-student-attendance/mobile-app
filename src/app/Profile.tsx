import { ChevronRight, Clock3, Copy, Info, LogOut, MapPin, ScanLine, ShieldCheck, TimerOff } from "lucide-react";
import type { Model } from "../domain/model";
import { formatDay } from "../domain/time";
import { initials, ScreenHead } from "./ui";

export function Profile({ model, onSignOut }: { model: Model; onSignOut: () => void }) {
  const { student, palm, params } = model;
  return (
    <>
      <ScreenHead title="Profile" />
      <div className="stack">
        <div className="card identity">
          <span className="avatar" aria-hidden>
            {initials(student.name)}
          </span>
          <div>
            <h2>{student.name}</h2>
            <p className="num">
              {student.student_id} · {student.program}
            </p>
          </div>
        </div>

        <section className="card">
          <div className="card-head">
            <h2>Palm registration</h2>
            <span className="chip chip-present">
              <ShieldCheck aria-hidden /> Registered
            </span>
          </div>
          <dl className="kv">
            <div>
              <dt>Date</dt>
              <dd>{formatDay(palm.registeredAt)} 2026</dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>Registration Office</dd>
            </div>
            <div>
              <dt>Palm template</dt>
              <dd className="num">•••• {palm.templateRef}</dd>
            </div>
          </dl>
          <p className="card-note">
            If a reader doesn't recognise your palm, visit the Registration Office to register it again.
          </p>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>How attendance is counted</h2>
          </div>
          <ul className="rules">
            <li>
              <ScanLine aria-hidden />
              <span>
                Scan your palm at the reader <strong>in your class's room</strong>.
              </span>
            </li>
            <li>
              <Clock3 aria-hidden />
              <span>
                Scanning opens <strong>{params.before} min before</strong> class starts. Earlier scans don't count.
              </span>
            </li>
            <li>
              <TimerOff aria-hidden />
              {params.after === null ? (
                <span>
                  Late scans count <strong>until class ends</strong>, and your minutes late are recorded.
                </span>
              ) : (
                <span>
                  Scans up to <strong>{params.after} min after</strong> the start count. Later than that, you're
                  marked absent.
                </span>
              )}
            </li>
            <li>
              <Copy aria-hidden />
              <span>If you scan more than once, your earliest valid scan counts.</span>
            </li>
            <li>
              <MapPin aria-hidden />
              <span>All times are Doha time.</span>
            </li>
          </ul>
        </section>

        <div className="list narrow-only">
          <a className="menu-link" href="#/about">
            <Info size={20} aria-hidden />
            How this preview works
            <ChevronRight size={18} aria-hidden />
          </a>
        </div>

        <button className="button danger" onClick={onSignOut}>
          <LogOut aria-hidden /> Sign out
        </button>
      </div>
    </>
  );
}
