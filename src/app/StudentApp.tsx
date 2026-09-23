import { BookOpen, CalendarDays, ChevronLeft, ScanLine, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Model } from "../domain/model";
import { formatClock } from "../domain/time";
import { Brief, type RulesProps } from "../brief/Brief";
import { navigate, useHashRoute } from "../hooks";
import { CourseDetail, Courses } from "./Courses";
import { Profile } from "./Profile";
import { Scans } from "./Scans";
import { SignIn } from "./SignIn";
import { Today } from "./Today";

const TABS = [
  { path: "today", label: "Today", icon: CalendarDays },
  { path: "courses", label: "Courses", icon: BookOpen },
  { path: "scans", label: "Scans", icon: ScanLine },
  { path: "profile", label: "Profile", icon: UserRound },
] as const;

export function StudentApp({
  model,
  signedIn,
  setSignedIn,
  rules,
}: {
  model: Model;
  signedIn: boolean;
  setSignedIn: (v: boolean) => void;
  rules: RulesProps;
}) {
  const route = useHashRoute();
  const main = useRef<HTMLElement>(null);
  const [page = "today", param] = route;
  const key = route.join("/");

  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
  }, [key]);

  let content;
  if (page === "about") {
    content = (
      <>
        <a className="back" href={signedIn ? "#/profile" : "#/"}>
          <ChevronLeft size={20} aria-hidden /> Back
        </a>
        <Brief inApp rules={rules} />
      </>
    );
  } else if (!signedIn) {
    content = (
      <SignIn
        onSignIn={() => {
          setSignedIn(true);
          navigate("today");
        }}
      />
    );
  } else if (page === "courses" && param) {
    content = <CourseDetail model={model} sectionId={Number(param)} />;
  } else if (page === "courses") {
    content = <Courses model={model} />;
  } else if (page === "scans") {
    content = <Scans model={model} />;
  } else if (page === "profile") {
    content = (
      <Profile
        model={model}
        onSignOut={() => {
          setSignedIn(false);
          navigate("");
        }}
      />
    );
  } else {
    content = <Today model={model} />;
  }

  const active = TABS.some((t) => t.path === page) ? page : "today";

  return (
    <div className="app">
      <div className="statusbar" aria-hidden>
        <span className="num">{formatClock(model.now)}</span>
        <span>Doha</span>
      </div>
      <main className="app-main" ref={main}>
        {content}
      </main>
      {signedIn && page !== "about" && (
        <nav className="tabbar" aria-label="Main">
          {TABS.map(({ path, label, icon: Icon }) => (
            <a key={path} className="tab" href={`#/${path}`} aria-current={active === path ? "page" : undefined}>
              <Icon aria-hidden strokeWidth={active === path ? 2.4 : 2} />
              {label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
