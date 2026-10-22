// Where the app's table rows come from: the built-in demo, or the attendance API's
// GET /students/:id/overview (reached through the app server's same-origin /api proxy).
import {
  COURSES,
  DEVICES,
  PALM_REG,
  REGISTRATIONS,
  ROOMS,
  SECTIONS,
  SEMESTER,
  STUDENT,
  buildLectures,
  buildTimeLogs,
} from "./demo";
import { dohaInstant, dohaWeekday } from "./time";
import type {
  AttendanceRow,
  Course,
  DeviceRoom,
  Lecture,
  PalmReg,
  Parameters,
  Registration,
  Room,
  Section,
  Student,
  TimeLog,
} from "./types";

export type Semester = { year: number; semester: number; label: string; start: string; end: string };

export type Dataset = {
  source: "demo" | "api";
  student: Student;
  semester: Semester;
  /** The student's current palm registration, if the registration desk linked one. */
  palmReg: PalmReg | null;
  rooms: Room[];
  devices: DeviceRoom[];
  courses: Course[];
  sections: Section[];
  registrations: Registration[];
  lectures: Lecture[];
  /** Raw scans of this student's palm that the server has received by `now`. */
  logsAt: (now: number) => TimeLog[];
  /** Attendance the server stored, valid for `serverParams`. Null in the demo. */
  serverAttendance: AttendanceRow[] | null;
  serverParams: Parameters | null;
};

export function demoDataset(): Dataset {
  const lectures = buildLectures();
  return {
    source: "demo",
    student: STUDENT,
    semester: SEMESTER,
    palmReg: PALM_REG[0],
    rooms: ROOMS,
    devices: DEVICES,
    courses: COURSES,
    sections: SECTIONS,
    registrations: REGISTRATIONS,
    lectures,
    logsAt: (now) => buildTimeLogs(lectures, now),
    serverAttendance: null,
    serverParams: null,
  };
}

/** Shape of GET /students/:id/overview. BIGINT ids arrive as strings. */
export type Overview = {
  student: { student_id: number; name: string | null; program: string | null };
  palm_reg: { student_id: number; student_palm: string; created_at: string }[];
  parameters: { Time_before_lecture_start: number | null; Time_after_lecture_start: number | null };
  rooms: { id: string | number; room: string }[];
  devices: { device_id: string; room_id: string | number | null }[];
  courses: { id: string | number; subject: string; course_num: string; title: string | null }[];
  sections: {
    id: string | number;
    academic_year: number;
    semester: number;
    course_id: string | number;
    room_id: string | number;
    section: string;
    instructor: string | null;
  }[];
  lectures: { id: string | number; schedule_id: string | number; lecture_date: string; start_time: string; end_time: string }[];
  attendance: {
    lecture_id: string | number;
    student_id: number;
    status: "present" | "absent";
    scan_time: string | null;
    late_minutes: number | null;
    reason: string | null;
  }[];
  time_logs: { id: string | number; device_id: string; time: string; student_palm: string }[];
};

const SEMESTER_NAMES: Record<number, string> = { 1: "Fall", 2: "Spring", 3: "Summer" };

export function datasetFromOverview(o: Overview): Dataset {
  const lectures: Lecture[] = o.lectures
    .map((l) => ({
      id: Number(l.id),
      schedule_id: Number(l.schedule_id),
      lecture_date: l.lecture_date,
      start_time: l.start_time,
      end_time: l.end_time,
      start: dohaInstant(l.lecture_date, l.start_time),
      end: dohaInstant(l.lecture_date, l.end_time),
    }))
    .sort((a, b) => a.start - b.start || a.id - b.id);

  const sections: Section[] = o.sections.map((s) => {
    const mine = lectures.filter((l) => l.schedule_id === Number(s.id));
    return {
      id: Number(s.id),
      academic_year: s.academic_year,
      semester: s.semester,
      course_id: Number(s.course_id),
      room_id: Number(s.room_id),
      section: s.section,
      instructor: s.instructor ?? "Instructor not listed",
      // The ERM has no meeting pattern; derive it from the lectures.
      days: [...new Set(mine.map((l) => dohaWeekday(l.start)))].sort(),
      start_time: mostCommon(mine.map((l) => l.start_time)) ?? "",
      end_time: mostCommon(mine.map((l) => l.end_time)) ?? "",
    };
  });

  const palms = o.palm_reg.map((p) => ({
    student_id: p.student_id,
    student_palm: p.student_palm,
    created_at: Date.parse(p.created_at),
  }));
  const first = sections[0];
  const year = first?.academic_year ?? new Date().getUTCFullYear();
  const semester = first?.semester ?? 1;
  const before = o.parameters.Time_before_lecture_start ?? 10;
  const logs: TimeLog[] = o.time_logs.map((t) => ({
    id: Number(t.id),
    device_id: t.device_id,
    time: Date.parse(t.time),
    student_palm: t.student_palm,
  }));

  return {
    source: "api",
    student: {
      student_id: o.student.student_id,
      name: o.student.name ?? `Student ${o.student.student_id}`,
      program: o.student.program ?? "Programme not listed",
    },
    semester: {
      year,
      semester,
      label: `${SEMESTER_NAMES[semester] ?? `Semester ${semester}`} ${year}`,
      start: lectures[0]?.lecture_date ?? "",
      end: lectures[lectures.length - 1]?.lecture_date ?? "",
    },
    palmReg: palms[0] ?? null,
    rooms: o.rooms.map((r) => ({ id: Number(r.id), room: r.room })),
    devices: o.devices.map((d) => ({
      device_id: d.device_id,
      room_id: d.room_id === null ? null : Number(d.room_id),
    })),
    courses: o.courses.map((c) => ({
      id: Number(c.id),
      subject: c.subject.trim(),
      course_num: c.course_num.trim(),
      title: c.title ?? `${c.subject.trim()} ${c.course_num.trim()}`,
    })),
    sections,
    registrations: sections.map((s) => ({ schedule_id: s.id, student_id: o.student.student_id })),
    lectures,
    logsAt: (now) => logs.filter((t) => t.time <= now),
    serverAttendance: o.attendance.map((a) => ({
      lecture_id: Number(a.lecture_id),
      student_id: a.student_id,
      status: a.status,
      scan_time: a.scan_time === null ? null : Date.parse(a.scan_time),
      late_minutes: a.late_minutes,
      reason: a.reason ?? "",
    })),
    serverParams: { before, after: o.parameters.Time_after_lecture_start },
  };
}

function mostCommon(values: string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
}

export class StudentNotFound extends Error {}

export async function fetchDataset(studentId: number, signal?: AbortSignal): Promise<Dataset> {
  const response = await fetch(`/api/students/${studentId}/overview`, { signal, cache: "no-store" });
  if (response.status === 404) throw new StudentNotFound(`No records for student ${studentId}`);
  if (!response.ok) throw new Error(`Attendance API returned ${response.status}`);
  return datasetFromOverview(((await response.json()) as { data: Overview }).data);
}

/** True when the app server proxies a reachable attendance API. */
export async function apiAvailable(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch("/api/health", { signal, cache: "no-store" });
    if (!response.ok) return false;
    return ((await response.json()) as { status?: string }).status === "ok";
  } catch {
    return false;
  }
}
