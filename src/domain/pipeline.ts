// Client-side port of the attendance-api processing steps:
//   POST /time-log-mappings/process  -> mapTimeLogs
//   POST /attendance/process         -> processAttendance (same rules and reason strings as the SQL)
// explainScans is app-only: it tells a student what happened to each of their scans.
import { dohaDate, MINUTE } from "./time";
import type {
  AttendanceRow,
  DeviceRoom,
  Lecture,
  PalmReg,
  Parameters,
  Registration,
  Section,
  TimeLog,
  TimeLogMapping,
  UnmappedReason,
} from "./types";

export const REASONS = {
  absent: "No valid scan found for this lecture window",
  lateNull: "Late scan accepted because Time_after_lecture_start is null",
  late: "Late scan inside allowed threshold",
  onTime: "Scan inside allowed threshold",
} as const;

export type Unmapped = { log: TimeLog; reason: UnmappedReason };

export function mapTimeLogs(
  logs: TimeLog[],
  palmReg: PalmReg[],
  devices: DeviceRoom[],
): { mapped: TimeLogMapping[]; unmapped: Unmapped[] } {
  const studentByPalm = new Map(palmReg.map((p) => [p.student_palm, p.student_id]));
  const deviceById = new Map(devices.map((d) => [d.device_id, d]));
  const mapped: TimeLogMapping[] = [];
  const unmapped: Unmapped[] = [];
  for (const log of logs) {
    const studentId = studentByPalm.get(log.student_palm);
    const device = deviceById.get(log.device_id);
    if (studentId === undefined) unmapped.push({ log, reason: "unknown_palm" });
    else if (!device) unmapped.push({ log, reason: "unknown_device" });
    else if (device.room_id === null) unmapped.push({ log, reason: "device_unassigned" });
    else
      mapped.push({
        id: mapped.length + 1,
        time_log_id: log.id,
        room_id: device.room_id,
        student_id: studentId,
        time: log.time,
      });
  }
  return { mapped, unmapped };
}

export function windowStart(lecture: Lecture, params: Parameters): number {
  return lecture.start - params.before * MINUTE;
}

export function windowEnd(lecture: Lecture, params: Parameters): number {
  return params.after === null ? lecture.end : lecture.start + params.after * MINUTE;
}

export function processAttendance(
  lectures: Lecture[],
  sections: Section[],
  registrations: Registration[],
  mappings: TimeLogMapping[],
  params: Parameters,
): AttendanceRow[] {
  const roomBySection = new Map(sections.map((s) => [s.id, s.room_id]));
  const scansByStudent = new Map<number, TimeLogMapping[]>();
  for (const m of mappings) {
    const list = scansByStudent.get(m.student_id) ?? [];
    list.push(m);
    scansByStudent.set(m.student_id, list);
  }
  for (const list of scansByStudent.values()) list.sort((a, b) => a.time - b.time);

  const rows: AttendanceRow[] = [];
  for (const lecture of lectures) {
    const roomId = roomBySection.get(lecture.schedule_id);
    const from = windowStart(lecture, params);
    const to = windowEnd(lecture, params);
    for (const reg of registrations) {
      if (reg.schedule_id !== lecture.schedule_id) continue;
      const scan = (scansByStudent.get(reg.student_id) ?? []).find(
        (m) => m.room_id === roomId && m.time >= from && m.time <= to,
      );
      if (!scan) {
        rows.push({
          lecture_id: lecture.id,
          student_id: reg.student_id,
          status: "absent",
          scan_time: null,
          late_minutes: null,
          reason: REASONS.absent,
        });
        continue;
      }
      const late = lateMinutes(lecture, scan.time);
      rows.push({
        lecture_id: lecture.id,
        student_id: reg.student_id,
        status: "present",
        scan_time: scan.time,
        late_minutes: params.after === null ? late : null,
        reason:
          params.after === null && late > 0 ? REASONS.lateNull : late > 0 ? REASONS.late : REASONS.onTime,
      });
    }
  }
  return rows;
}

/** Whole minutes after lecture start, floored, never negative (matches the SQL). */
export function lateMinutes(lecture: Lecture, scanTime: number): number {
  return Math.max(0, Math.floor((scanTime - lecture.start) / MINUTE));
}

export type ScanOutcome =
  | { kind: "counted"; lectureId: number; late: number }
  | { kind: "duplicate"; lectureId: number }
  | { kind: "too_early"; lectureId: number; minutes: number }
  | { kind: "too_late"; lectureId: number; minutes: number }
  | { kind: "wrong_room"; lectureId: number }
  | { kind: "no_class" }
  | { kind: "unmapped"; reason: UnmappedReason };

export type ExplainedScan = { log: TimeLog; roomId: number | null; outcome: ScanOutcome };

/** Explain every raw scan for one student, newest first. */
export function explainScans(input: {
  studentId: number;
  palm: string;
  logs: TimeLog[];
  mapped: TimeLogMapping[];
  unmapped: Unmapped[];
  lectures: Lecture[];
  sections: Section[];
  registrations: Registration[];
  attendance: AttendanceRow[];
  devices: DeviceRoom[];
  params: Parameters;
}): ExplainedScan[] {
  const { studentId, params } = input;
  const mySections = new Set(
    input.registrations.filter((r) => r.student_id === studentId).map((r) => r.schedule_id),
  );
  const roomBySection = new Map(input.sections.map((s) => [s.id, s.room_id]));
  const myLectures = input.lectures.filter((l) => mySections.has(l.schedule_id));
  const lecturesByDate = new Map<string, Lecture[]>();
  for (const l of myLectures) {
    const list = lecturesByDate.get(l.lecture_date) ?? [];
    list.push(l);
    lecturesByDate.set(l.lecture_date, list);
  }
  const countedScan = new Map(
    input.attendance
      .filter((a) => a.student_id === studentId && a.scan_time !== null)
      .map((a) => [a.lecture_id, a.scan_time as number]),
  );
  const mappedByLog = new Map(input.mapped.map((m) => [m.time_log_id, m]));
  const unmappedByLog = new Map(input.unmapped.map((u) => [u.log.id, u.reason]));
  const deviceRoom = new Map(input.devices.map((d) => [d.device_id, d.room_id]));

  const result: ExplainedScan[] = [];
  for (const log of input.logs) {
    if (log.student_palm !== input.palm) continue;
    const unmappedReason = unmappedByLog.get(log.id);
    if (unmappedReason) {
      result.push({
        log,
        roomId: deviceRoom.get(log.device_id) ?? null,
        outcome: { kind: "unmapped", reason: unmappedReason },
      });
      continue;
    }
    const m = mappedByLog.get(log.id);
    if (!m || m.student_id !== studentId) continue;

    const sameDay = lecturesByDate.get(dohaDate(m.time)) ?? [];
    const inWindow = sameDay.find(
      (l) =>
        roomBySection.get(l.schedule_id) === m.room_id &&
        m.time >= windowStart(l, params) &&
        m.time <= windowEnd(l, params),
    );
    let outcome: ScanOutcome;
    if (inWindow) {
      outcome =
        countedScan.get(inWindow.id) === m.time
          ? { kind: "counted", lectureId: inWindow.id, late: lateMinutes(inWindow, m.time) }
          : { kind: "duplicate", lectureId: inWindow.id };
    } else {
      const nearest = sameDay
        .slice()
        .sort((a, b) => Math.abs(a.start - m.time) - Math.abs(b.start - m.time))[0];
      if (!nearest || Math.abs(nearest.start - m.time) > 3 * 60 * MINUTE) {
        outcome = { kind: "no_class" };
      } else if (roomBySection.get(nearest.schedule_id) !== m.room_id) {
        outcome = { kind: "wrong_room", lectureId: nearest.id };
      } else if (m.time < windowStart(nearest, params)) {
        outcome = {
          kind: "too_early",
          lectureId: nearest.id,
          minutes: Math.ceil((nearest.start - m.time) / MINUTE),
        };
      } else {
        outcome = { kind: "too_late", lectureId: nearest.id, minutes: lateMinutes(nearest, m.time) };
      }
    }
    result.push({ log, roomId: m.room_id, outcome });
  }
  return result.sort((a, b) => b.log.time - a.log.time);
}
