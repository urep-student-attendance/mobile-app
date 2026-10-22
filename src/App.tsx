import { useEffect, useMemo, useRef, useState } from "react";
import { StudentApp } from "./app/StudentApp";
import { Brief } from "./brief/Brief";
import { buildModel, DEFAULT_PARAMS, sameParams } from "./domain/model";
import { apiAvailable, demoDataset, fetchDataset, StudentNotFound, type Dataset } from "./domain/source";
import type { Parameters } from "./domain/types";
import { useNow, useStoredState } from "./hooks";

export type Session = { kind: "demo" } | { kind: "api"; studentId: number } | null;

const REFRESH_MS = 30_000;

export function App() {
  const now = useNow();
  const [params, setParams] = useState<Parameters>(DEFAULT_PARAMS);
  const [session, setSession] = useStoredState<Session>("urep-attendance.session", null);
  const [apiUp, setApiUp] = useState<boolean | null>(null);
  const [live, setLive] = useState<Dataset | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const demo = useMemo(demoDataset, []);
  const lastServerParams = useRef<Parameters | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiAvailable(controller.signal).then(setApiUp);
    return () => controller.abort();
  }, []);

  const studentId = session?.kind === "api" ? session.studentId : null;
  useEffect(() => {
    setLive(null);
    lastServerParams.current = null;
    if (studentId === null) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const data = await fetchDataset(studentId, controller.signal);
        // Follow the server's rules unless the viewer is trying other rules in the playground.
        setParams((current) =>
          lastServerParams.current === null || sameParams(current, lastServerParams.current)
            ? data.serverParams!
            : current,
        );
        lastServerParams.current = data.serverParams;
        setLive(data);
        setSignInError(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof StudentNotFound) {
          setSession(null);
          setSignInError(`No attendance records for student ${studentId}.`);
        } else if (lastServerParams.current === null) {
          setSession(null);
          setSignInError("The attendance service isn't responding. Try again, or open the demo.");
        }
      }
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      controller.abort();
      window.clearInterval(id);
    };
  }, [studentId, setSession]);

  const data = session?.kind === "api" ? live : demo;
  const model = useMemo(() => buildModel(now, params, data ?? demo), [now, params, data, demo]);
  const rules = {
    params,
    setParams,
    model,
    defaults: data?.serverParams ?? DEFAULT_PARAMS,
  };
  const loading = session?.kind === "api" && live === null;

  return (
    <div className="stage">
      <aside className="brief" aria-label="About this preview">
        <Brief rules={rules} />
      </aside>
      <div className="device-wrap">
        <div className="device">
          <StudentApp
            model={model}
            session={session}
            loading={loading}
            apiUp={apiUp}
            signInError={signInError}
            onSignIn={(next) => {
              setSignInError(null);
              if (next.kind === "demo") setParams(DEFAULT_PARAMS);
              setSession(next);
            }}
            onSignOut={() => {
              setParams(DEFAULT_PARAMS);
              setSession(null);
            }}
            rules={rules}
          />
        </div>
        <p className="device-caption">Live preview · scroll and tap inside the phone</p>
      </div>
    </div>
  );
}
