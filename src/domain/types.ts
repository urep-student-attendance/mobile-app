// Shapes mirror the attendance-api PostgreSQL schema (migrations/001_initial_schema.sql).
// Fields marked "app" are not in that schema yet; the app needs them from the SIS.

export type Room = { id: number; room: string };

/** device_room: a PALM reader linked to a room. room_id null = reader not assigned yet. */
export type DeviceRoom = { device_id: string; room_id: number | null };

/** palm_reg */
export type PalmReg = { student_id: number; student_palm: string; created_at: number };

/** courses (+ app: title) */
export type Course = { id: number; subject: string; course_num: string; title: string };

/** schedule (+ app: instructor, meeting pattern) */
export type Section = {
  id: number;
  academic_year: number;
  semester: number;
  course_id: number;
  room_id: number;
  section: string;
  instructor: string;
  /** Doha weekdays, 0 = Sunday */
  days: number[];
  start_time: string;
  end_time: string;
};

/** registration */
export type Registration = { schedule_id: number; student_id: number };

/** lectures, with start/end resolved to epoch ms in Asia/Qatar */
export type Lecture = {
  id: number;
  schedule_id: number;
  lecture_date: string;
  start_time: string;
  end_time: string;
  start: number;
  end: number;
};

/** time_log: raw scan exactly as a reader sends it */
export type TimeLog = { id: number; device_id: string; time: number; student_palm: string };

/** time_log_mapping */
export type TimeLogMapping = {
  id: number;
  time_log_id: number;
  room_id: number;
  student_id: number;
  time: number;
};

export type UnmappedReason = "unknown_palm" | "unknown_device" | "device_unassigned";

/** parameters: minutes; after = null means "no late cutoff, record late minutes". */
export type Parameters = { before: number; after: number | null };

export type AttendanceStatus = "present" | "absent";

/** student_attendance */
export type AttendanceRow = {
  lecture_id: number;
  student_id: number;
  status: AttendanceStatus;
  scan_time: number | null;
  late_minutes: number | null;
  reason: string;
};

export type Student = {
  student_id: number;
  name: string;
  program: string;
};
