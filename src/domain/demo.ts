// Deterministic demo data for the web preview. Everything here is fictional.
// It is shaped like the attendance-api tables so the live API can replace it later.
import { addDays, dohaInstant, dohaWeekday, MINUTE } from "./time";
import type {
  Course,
  DeviceRoom,
  Lecture,
  PalmReg,
  Registration,
  Room,
  Section,
  Student,
  TimeLog,
} from "./types";

export const SEMESTER = { year: 2026, semester: 1, label: "Fall 2026", start: "2026-08-30", end: "2026-12-10" };

export const STUDENT: Student = {
  student_id: 60412345,
  name: "Layla Mansour",
  program: "BSc Information Technology",
};

export const STUDENT_PALM = "pv-7f3a91c2";

export const ROOMS: Room[] = [
  { id: 1, room: "10.2.33" },
  { id: 2, room: "10.1.08" },
  { id: 3, room: "10.3.12" },
  { id: 4, room: "5.2.14" },
];

export const DEVICES: DeviceRoom[] = [
  { device_id: "reader-10.2.33", room_id: 1 },
  { device_id: "reader-10.1.08", room_id: 2 },
  { device_id: "reader-10.3.12", room_id: 3 },
  { device_id: "reader-5.2.14", room_id: 4 },
  // Installed in a lobby but not linked to a room yet, so its scans cannot be mapped.
  { device_id: "reader-5.0.01", room_id: null },
];

export const COURSES: Course[] = [
  { id: 1, subject: "INF", course_num: "1201", title: "Programming I" },
  { id: 2, subject: "MATH", course_num: "1102", title: "Calculus II" },
  { id: 3, subject: "INF", course_num: "2305", title: "Database Systems" },
  { id: 4, subject: "COMM", course_num: "1010", title: "Technical Communication" },
];

export const SECTIONS: Section[] = [
  { id: 1, academic_year: 2026, semester: 1, course_id: 1, room_id: 1, section: "A", instructor: "Dr. S. Khalil", days: [0, 2], start_time: "09:00", end_time: "10:15" },
  { id: 2, academic_year: 2026, semester: 1, course_id: 2, room_id: 2, section: "B", instructor: "Dr. H. Yousef", days: [1, 3], start_time: "11:00", end_time: "12:15" },
  { id: 3, academic_year: 2026, semester: 1, course_id: 3, room_id: 3, section: "A", instructor: "Mr. O. Farouk", days: [1, 3], start_time: "14:00", end_time: "15:15" },
  { id: 4, academic_year: 2026, semester: 1, course_id: 4, room_id: 4, section: "C", instructor: "Ms. R. Saleh", days: [4], start_time: "10:00", end_time: "12:30" },
];

export const REGISTRATIONS: Registration[] = SECTIONS.map((s) => ({
  schedule_id: s.id,
  student_id: STUDENT.student_id,
}));

export const PALM_REG: PalmReg[] = [
  { student_id: STUDENT.student_id, student_palm: STUDENT_PALM, created_at: dohaInstant("2026-08-26", "10:40") },
];

export function buildLectures(): Lecture[] {
  const lectures: Lecture[] = [];
  for (let date = SEMESTER.start; date <= SEMESTER.end; date = addDays(date, 1)) {
    const weekday = dohaWeekday(dohaInstant(date, "12:00"));
    for (const s of SECTIONS) {
      if (!s.days.includes(weekday)) continue;
      lectures.push({
        id: lectures.length + 1,
        schedule_id: s.id,
        lecture_date: date,
        start_time: s.start_time,
        end_time: s.end_time,
        start: dohaInstant(date, s.start_time),
        end: dohaInstant(date, s.end_time),
      });
    }
  }
  return lectures.sort((a, b) => a.start - b.start);
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Raw reader scans up to `now`. Each lecture gets a seeded behaviour so reloads look the same. */
export function buildTimeLogs(lectures: Lecture[], now: number): TimeLog[] {
  const raw: Omit<TimeLog, "id">[] = [];
  const deviceForRoom = (roomId: number) => DEVICES.find((d) => d.room_id === roomId)!.device_id;
  const at = (lecture: Lecture, minutes: number, r: () => number) =>
    lecture.start + Math.round((minutes * 60 + r() * 59) * 1000);

  for (const lecture of lectures) {
    if (lecture.start - 45 * MINUTE > now) break;
    const section = SECTIONS.find((s) => s.id === lecture.schedule_id)!;
    const r = rng(lecture.id * 7919 + 17);
    const device = deviceForRoom(section.room_id);
    const weak = section.id === 2; // one course with weaker attendance, to show the warning state
    const roll = r();
    const t = {
      noScan: weak ? 0.12 : 0.035,
      wrongRoom: 0.02,
      tooEarly: 0.035,
      veryLate: weak ? 0.1 : 0.04,
      late: 0.12,
    };
    let edge = 0;
    const push = (time: number, device_id = device) => raw.push({ device_id, time, student_palm: STUDENT_PALM });

    if (roll < (edge += t.noScan)) continue;
    if (roll < (edge += t.wrongRoom)) {
      const otherRoom = (section.room_id % ROOMS.length) + 1;
      push(at(lecture, -4 + r() * 6, r), deviceForRoom(otherRoom));
      continue;
    }
    if (roll < (edge += t.tooEarly)) {
      push(at(lecture, -(15 + r() * 18), r));
      if (r() < 0.5) push(at(lecture, -6 + r() * 7, r));
      continue;
    }
    let minutes: number;
    if (roll < (edge += t.veryLate)) minutes = 22 + r() * 28;
    else if (roll < (edge += t.late)) minutes = 4 + r() * 14;
    else minutes = -9 + r() * 8.9; // plus up to 59 s, so always before the start minute ends
    const first = at(lecture, minutes, r);
    push(first);
    if (r() < 0.12) push(first + Math.round((40 + r() * 200) * 1000));
  }

  // A scan at the unassigned lobby reader.
  raw.push({ device_id: "reader-5.0.01", time: dohaInstant("2026-09-10", "09:47") + 21_000, student_palm: STUDENT_PALM });

  return raw
    .filter((s) => s.time <= now)
    .sort((a, b) => a.time - b.time)
    .map((s, i) => ({ ...s, id: i + 1 }));
}
