import { Hand, Info } from "lucide-react";
import { useState, type FormEvent } from "react";
import { STUDENT } from "../domain/demo";

// Deliberately no password field: this preview is UDST-branded but not on a UDST domain,
// so it must never look like a place to type university credentials.
export function SignIn({ onSignIn }: { onSignIn: () => void }) {
  const [id, setId] = useState(String(STUDENT.student_id));
  const [touched, setTouched] = useState(false);
  const idError = /^60\d{6}$/.test(id.trim()) ? "" : "Student IDs are 8 digits and start with 60.";

  function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!idError) onSignIn();
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
            onChange={(e) => setId(e.target.value)}
            aria-invalid={touched && !!idError}
            aria-describedby={touched && idError ? "sid-error" : undefined}
          />
          {touched && idError && (
            <span className="field-error" id="sid-error">
              {idError}
            </span>
          )}
        </div>
        <button className="button" type="submit">
          Open demo
        </button>
      </form>
      <p className="demo-note">
        <Info aria-hidden />
        <span>
          UREP research preview with a fictional student. The real app will sign in with your UDST account.{" "}
          <a href="#/about" className="narrow-inline">
            About this preview
          </a>
        </span>
      </p>
    </div>
  );
}
