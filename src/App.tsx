import { useMemo, useState } from "react";
import { StudentApp } from "./app/StudentApp";
import { Brief } from "./brief/Brief";
import { buildModel, DEFAULT_PARAMS } from "./domain/model";
import type { Parameters } from "./domain/types";
import { useNow, useStoredState } from "./hooks";

export function App() {
  const now = useNow();
  const [params, setParams] = useState<Parameters>(DEFAULT_PARAMS);
  const [signedIn, setSignedIn] = useStoredState("urep-attendance.signed-in", false);
  const model = useMemo(() => buildModel(now, params), [now, params]);
  const rules = { params, setParams, model };

  return (
    <div className="stage">
      <aside className="brief" aria-label="About this preview">
        <Brief rules={rules} />
      </aside>
      <div className="device-wrap">
        <div className="device">
          <StudentApp model={model} signedIn={signedIn} setSignedIn={setSignedIn} rules={rules} />
        </div>
        <p className="device-caption">Live preview · scroll and tap inside the phone</p>
      </div>
    </div>
  );
}
