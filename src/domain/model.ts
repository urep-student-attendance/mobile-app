// Turns the table-shaped data into what the student screens show.
import {
  COURSES,
  DEVICES,
  PALM_REG,
  REGISTRATIONS,
  ROOMS,
  SECTIONS,
  SEMESTER,
  STUDENT,
  STUDENT_PALM,
  buildLectures,
  buildTimeLogs,
} from "./demo";
import {
  explainScans,
  lateMinutes,
  mapTimeLogs,
  processAttendance,
  windowEnd,
  windowStart,
  type ExplainedScan,
} from "./pipeline";
import { dohaDate } from "./time";
import type { AttendanceRow, Course, Lecture, Parameters, Room, Section } from "./types";

/** Proposed parameter: attendance below this percentage is flagged. Not in the API yet. */
export const MIN_ATTENDANCE_PERCENT = 85;

export const DEFAULT_PARAMS: Parameters = { before: 10, after: 20 };

export type LectureStatus = "upcoming" | "open" | "present" | "late" | "absent";

export type LectureView = {
  lecture: Lecture;
  section: SectionView;
  status: LectureStatus;
  windowStart: number;
  windowEnd: number;
  row: AttendanceRow | null;
  /** minutes after start of the counted scan */
  lateBy: number;
  /** for an absent class: a scan that was rejected for it (too early, too late, wrong room) */
  rejected?: ExplainedScan;
};

export type Stats = {
  counted: number;
  attended: number;
  late: number;
  missed: number;
  total: number;
  remaining: number;
  rate: number | null;
  /** absences still allowed before the rate can fall below the minimum, for the whole semester */
  absencesLeft: number;
};

export type SectionView = {
  section: Section;
  course: Course;
  room: Room;
  code: string;
  stats: Stats;
  lectures: LectureView[];
};

export type Model = {
  student: typeof STUDENT;
  semester: typeof SEMESTER;
  palm: { registeredAt: number; templateRef: string };
  sections: SectionView[];
  lectures: LectureView[];
  overall: Stats;
  scans: ExplainedScan[];
  lectureById: Map<number, LectureView>;
  roomById: Map<number, Room>;
  params: Parameters;
  now: number;
};

export function courseCode(course: Course): string {
  return `${course.subject} ${course.course_num}`;
}

function emptyStats(): Stats {
  return { counted: 0, attended: 0, late: 0, missed: 0, total: 0, remaining: 0, rate: null, absencesLeft: 0 };
}

function finish(stats: Stats): Stats {
  const rate = stats.counted ? Math.round((stats.attended / stats.counted) * 100) : null;
  const allowed = Math.floor(stats.total * (1 - MIN_ATTENDANCE_PERCENT / 100));
  return { ...stats, rate, absencesLeft: allowed - stats.missed };
}

export function buildModel(now: number, params: Parameters): Model {
  const lectures = buildLectures();
  const logs = buildTimeLogs(lectures, now);
  const { mapped, unmapped } = mapTimeLogs(logs, PALM_REG, DEVICES);
  // The server would only process lectures whose scans exist; processing all is equivalent for display.
  const attendance = processAttendance(lectures, SECTIONS, REGISTRATIONS, mapped, params);
  const rowByLecture = new Map(
    attendance.filter((a) => a.student_id === STUDENT.student_id).map((a) => [a.lecture_id, a]),
  );
  const roomById = new Map(ROOMS.map((r) => [r.id, r]));

  const sections: SectionView[] = SECTIONS.map((section) => {
    const course = COURSES.find((c) => c.id === section.course_id)!;
    return {
      section,
      course,
      room: roomById.get(section.room_id)!,
      code: courseCode(course),
      stats: emptyStats(),
      lectures: [],
    };
  });
  const sectionById = new Map(sections.map((s) => [s.section.id, s]));

  const views: LectureView[] = lectures.map((lecture) => {
    const section = sectionById.get(lecture.schedule_id)!;
    const from = windowStart(lecture, params);
    const to = windowEnd(lecture, params);
    const row = rowByLecture.get(lecture.id) ?? null;
    const present = row?.status === "present" && row.scan_time !== null && row.scan_time <= now;
    const lateBy = present ? lateMinutes(lecture, row!.scan_time!) : 0;
    let status: LectureStatus;
    if (present) status = lateBy > 0 ? "late" : "present";
    else if (now < from) status = "upcoming";
    else if (now <= to) status = "open";
    else status = "absent";
    const view: LectureView = { lecture, section, status, windowStart: from, windowEnd: to, row, lateBy };
    section.lectures.push(view);
    return view;
  });

  const overall = emptyStats();
  for (const s of sections) {
    for (const v of s.lectures) {
      for (const stats of [s.stats, overall]) {
        stats.total++;
        if (v.status === "upcoming" || v.status === "open") stats.remaining++;
        else stats.counted++;
        if (v.status === "present" || v.status === "late") stats.attended++;
        if (v.status === "late") stats.late++;
        if (v.status === "absent") stats.missed++;
      }
    }
    s.stats = finish(s.stats);
  }

  const scans = explainScans({
    studentId: STUDENT.student_id,
    palm: STUDENT_PALM,
    logs,
    mapped,
    unmapped,
    lectures,
    sections: SECTIONS,
    registrations: REGISTRATIONS,
    attendance,
    devices: DEVICES,
    params,
  });

  const lectureById = new Map(views.map((v) => [v.lecture.id, v]));
  for (const scan of scans) {
    const o = scan.outcome;
    if (o.kind !== "too_early" && o.kind !== "too_late" && o.kind !== "wrong_room") continue;
    const view = lectureById.get(o.lectureId);
    if (view?.status === "absent" && !view.rejected) view.rejected = scan;
  }

  return {
    student: STUDENT,
    semester: SEMESTER,
    palm: { registeredAt: PALM_REG[0].created_at, templateRef: STUDENT_PALM.slice(-4).toUpperCase() },
    sections,
    lectures: views,
    overall: finish(overall),
    scans,
    lectureById,
    roomById,
    params,
    now,
  };
}

export function lecturesOn(model: Model, date: string): LectureView[] {
  return model.lectures.filter((v) => v.lecture.lecture_date === date);
}

export function nextLecture(model: Model): LectureView | undefined {
  return model.lectures.find((v) => v.lecture.start > model.now && dohaDate(v.lecture.start) !== dohaDate(model.now));
}
