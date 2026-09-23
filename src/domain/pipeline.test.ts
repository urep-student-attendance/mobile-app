import { describe, expect, it } from "vitest";
import { explainScans, mapTimeLogs, processAttendance, REASONS } from "./pipeline";
import { dohaDate, dohaInstant, MINUTE } from "./time";
import { buildLectures, buildTimeLogs, SECTIONS } from "./demo";
import { buildModel, DEFAULT_PARAMS } from "./model";
import type { DeviceRoom, Lecture, PalmReg, Parameters, Section, TimeLog } from "./types";

const STUDENT = 60000001;
const PALM = "demo-palm-1";
const section: Section = {
  id: 1, academic_year: 2026, semester: 1, course_id: 1, room_id: 1, section: "A",
  instructor: "", days: [2], start_time: "09:00", end_time: "10:00",
};
const lecture: Lecture = {
  id: 1, schedule_id: 1, lecture_date: "2026-06-09", start_time: "09:00", end_time: "10:00",
  start: dohaInstant("2026-06-09", "09:00"), end: dohaInstant("2026-06-09", "10:00"),
};
const devices: DeviceRoom[] = [
  { device_id: "device-b-101", room_id: 1 },
  { device_id: "device-b-102", room_id: 2 },
];
const palmReg: PalmReg[] = [{ student_id: STUDENT, student_palm: PALM, created_at: 0 }];

function run(offsetsMinutes: number[], params: Parameters = DEFAULT_PARAMS, device = "device-b-101") {
  const logs: TimeLog[] = offsetsMinutes.map((m, i) => ({
    id: i + 1, device_id: device, time: lecture.start + m * MINUTE, student_palm: PALM,
  }));
  const { mapped, unmapped } = mapTimeLogs(logs, palmReg, devices);
  const rows = processAttendance([lecture], [section], [{ schedule_id: 1, student_id: STUDENT }], mapped, params);
  return { rows, row: rows[0], mapped, unmapped, logs };
}

describe("time helpers", () => {
  it("resolves Doha wall clock to UTC+3", () => {
    expect(dohaInstant("2026-09-23", "09:00")).toBe(Date.UTC(2026, 8, 23, 6, 0));
    expect(dohaDate(Date.UTC(2026, 8, 23, 21, 30))).toBe("2026-09-24");
  });
});

describe("attendance rules (parity with attendance-api)", () => {
  it("marks a scan at lecture start present", () => {
    expect(run([0]).row).toMatchObject({ status: "present", late_minutes: null, reason: REASONS.onTime });
  });

  it("accepts the earliest allowed scan", () => {
    expect(run([-10]).row.status).toBe("present");
  });

  it("rejects a scan before the early threshold", () => {
    expect(run([-11]).row).toMatchObject({ status: "absent", scan_time: null, reason: REASONS.absent });
  });

  it("accepts a late scan inside the threshold without recording minutes", () => {
    expect(run([15]).row).toMatchObject({ status: "present", late_minutes: null, reason: REASONS.late });
  });

  it("rejects a scan after the late threshold", () => {
    expect(run([21]).row.status).toBe("absent");
  });

  it("records late minutes until lecture end when the late threshold is null", () => {
    const params = { before: 10, after: null };
    expect(run([35], params).row).toMatchObject({ status: "present", late_minutes: 35, reason: REASONS.lateNull });
    expect(run([61], params).row.status).toBe("absent");
  });

  it("marks a student with no scan absent", () => {
    expect(run([]).row.status).toBe("absent");
  });

  it("uses the earliest valid scan when there are several", () => {
    const { row } = run([-30, 3, 1, 12]);
    expect(row.scan_time).toBe(lecture.start + 1 * MINUTE);
  });

  it("ignores a scan from another room's reader", () => {
    expect(run([0], DEFAULT_PARAMS, "device-b-102").row.status).toBe("absent");
  });

  it("leaves unknown palms and devices unmapped", () => {
    const logs: TimeLog[] = [
      { id: 1, device_id: "device-b-101", time: lecture.start, student_palm: "nobody" },
      { id: 2, device_id: "device-x", time: lecture.start, student_palm: PALM },
      { id: 3, device_id: "unassigned", time: lecture.start, student_palm: PALM },
    ];
    const { mapped, unmapped } = mapTimeLogs(logs, palmReg, [...devices, { device_id: "unassigned", room_id: null }]);
    expect(mapped).toHaveLength(0);
    expect(unmapped.map((u) => u.reason)).toEqual(["unknown_palm", "unknown_device", "device_unassigned"]);
  });
});

describe("scan explanations", () => {
  function explain(offsets: number[], device = "device-b-101") {
    const r = run(offsets, DEFAULT_PARAMS, device);
    return explainScans({
      studentId: STUDENT, palm: PALM, logs: r.logs, mapped: r.mapped, unmapped: r.unmapped,
      lectures: [lecture], sections: [section], registrations: [{ schedule_id: 1, student_id: STUDENT }],
      attendance: r.rows, devices, params: DEFAULT_PARAMS,
    }).map((s) => s.outcome.kind);
  }

  it("labels counted, duplicate, early and late scans", () => {
    // newest first
    expect(explain([-25, 2, 5, 40])).toEqual(["too_late", "duplicate", "counted", "too_early"]);
  });

  it("labels wrong-room scans", () => {
    expect(explain([0], "device-b-102")).toEqual(["wrong_room"]);
  });
});

describe("demo data", () => {
  const now = dohaInstant("2026-09-23", "13:30");

  it("is deterministic", () => {
    const lectures = buildLectures();
    expect(buildTimeLogs(lectures, now)).toEqual(buildTimeLogs(lectures, now));
  });

  it("only schedules lectures on section meeting days", () => {
    for (const l of buildLectures()) {
      const s = SECTIONS.find((x) => x.id === l.schedule_id)!;
      expect(s.days).toContain(new Date(l.start + 3 * 3600e3).getUTCDay());
    }
  });

  it("shows an open scan window before the student has scanned", () => {
    // MATH 1102 meets Wed 11:00; its window opens at 10:50.
    const model = buildModel(dohaInstant("2026-09-23", "10:55"), DEFAULT_PARAMS);
    const math = model.lectures.find((v) => v.lecture.lecture_date === "2026-09-23" && v.section.code === "MATH 1102")!;
    expect(math.status).toBe("open");
    expect(buildModel(dohaInstant("2026-09-23", "10:40"), DEFAULT_PARAMS).lectureById.get(math.lecture.id)!.status).toBe(
      "upcoming",
    );
  });

  it("explains absences with the scan that was rejected", () => {
    const model = buildModel(now, DEFAULT_PARAMS);
    const absentWithScan = model.lectures.filter((v) => v.status === "absent" && v.rejected);
    expect(absentWithScan.length).toBeGreaterThan(0);
    for (const v of absentWithScan) {
      expect(["too_early", "too_late", "wrong_room"]).toContain(v.rejected!.outcome.kind);
    }
  });

  it("recomputes attendance when rules change", () => {
    const strict = buildModel(now, DEFAULT_PARAMS).overall;
    const lenient = buildModel(now, { before: 10, after: null }).overall;
    expect(lenient.attended).toBeGreaterThan(strict.attended);
    expect(strict.counted).toBeGreaterThan(20);
    expect(strict.missed).toBeGreaterThan(0);
  });
});
