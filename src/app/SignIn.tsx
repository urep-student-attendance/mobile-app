import { Hand, Info } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { Session } from "../App";
import { STUDENT } from "../domain/demo";

// Deliberately no password field: this preview is UDST-branded but not on a UDST domain,
// so it must never look like a place to type university credentials.
export function SignIn({
  apiUp,
  error,
  onSignIn,
}: {
  /** null while checking whether the attendance API is reachable */
  apiUp: boolean | null;
  error: string | null;
  onSignIn: (session: NonNullable<Session>) => void;
}) {
  const live = apiUp === true;
  const [typed, setTyped] = useState<string | null>(null);
  const id = typed ?? (live ? "" : String(STUDENT.student_id));
  const [touched, setTouched] = useState(false);
  const idError = /^60\d{6}$/.test(id.trim()) ? "" : "Student IDs are 8 digits and start with 60.";

  function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (idError) return;
    onSignIn(live ? { kind: "api", studentId: Number(id.trim()) } : { kind: "demo" });
  }

  return (
    <div className="signin">
      <div className="signin-brand">
        <span className="brandmark" aria-hidden>
          <Hand strokeWidth={1.9} />
        </span>
        <div className="uni">
          <span lang="ar" dir="rtl">
            جامعة الدوحة للعلوم والتكنولوجيا
          </span>
          <span>University of Doha for Science and Technology</span>
        </div>
      </div>
      <h1>
        Attendance,
        <br />
        scan by scan.
      </h1>
      <p>Check your classes, palm scans and attendance record in one place.</p>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="sid">Student ID</label>
          <input
            id="sid"
            inputMode="numeric"
            autoComplete="off"
            value={id}
            placeholder={live ? "60xxxxxx" : undefined}
            onChange={(e) => setTyped(e.target.value)}
            aria-invalid={touched && !!idError}
            aria-describedby={touched && idError ? "sid-error" : undefined}
          />
          {touched && idError && (
            <span className="field-error" id="sid-error">
              {idError}
            </span>
          )}
        </div>
        {error && (
          <p className="signin-alert" role="alert">
            {error}
          </p>
        )}
        <button className="button" type="submit">
          {live ? "Open my attendance" : "Open demo"}
        </button>
        {live && (
          <button className="button button-ghost" type="button" onClick={() => onSignIn({ kind: "demo" })}>
            Use the demo student instead
          </button>
        )}
      </form>
      <p className="demo-note">
        <Info aria-hidden />
        <span>
          {live
            ? "UREP research preview connected to the attendance API. Its students and scans come from simulated palm readers, not real people."
            : "UREP research preview with a fictional student."}{" "}
          The real app will sign in with your UDST account.{" "}
          <a href="#/about" className="narrow-inline">
            About this preview
          </a>
        </span>
      </p>
    </div>
  );
}
