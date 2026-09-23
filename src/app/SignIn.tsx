import { Hand, Info } from "lucide-react";
import { useState, type FormEvent } from "react";
import { STUDENT } from "../domain/demo";

export function SignIn({ onSignIn }: { onSignIn: () => void }) {
  const [id, setId] = useState(String(STUDENT.student_id));
  const [password, setPassword] = useState("demo-password");
  const [touched, setTouched] = useState(false);
  const idError = /^60\d{6}$/.test(id.trim()) ? "" : "Student IDs are 8 digits and start with 60.";
  const passwordError = password ? "" : "Enter your password.";

  function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (idError || passwordError) return;
    onSignIn();
  }

  return (
    <div className="signin">
      <span className="brandmark" aria-hidden>
        <Hand strokeWidth={1.8} />
      </span>
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
            autoComplete="username"
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
        <div className="field">
          <label htmlFor="pw">Password</label>
          <input
            id="pw"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={touched && !!passwordError}
            aria-describedby={touched && passwordError ? "pw-error" : undefined}
          />
          {touched && passwordError && (
            <span className="field-error" id="pw-error">
              {passwordError}
            </span>
          )}
        </div>
        <button className="button" type="submit">
          Sign in
        </button>
      </form>
      <p className="demo-note">
        <Info aria-hidden />
        <span>
          Preview build. Any 60xxxxxx ID and password open the fictional demo student.{" "}
          <a href="#/about" className="narrow-inline">
            About this preview
          </a>
        </span>
      </p>
    </div>
  );
}
