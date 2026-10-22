import { describe, expect, it } from "vitest";
import { buildModel } from "./model";
import { REASONS } from "./pipeline";
import { datasetFromOverview, type Overview } from "./source";
import { dohaInstant } from "./time";

// Shaped like GET /students/:id/overview from attendance-api, BIGINT ids as strings.
function overview(): Overview {
  return {
    student: { student_id: 60301234, name: "Omar Haddad", program: "BSc Cybersecurity" },
    palm_reg: [{ student_id: 60301234, student_palm: "PV-0A1B2C3D", created_at: "2026-08-26T07:40:00.000Z" }],
    parameters: { Time_before_lecture_start: 10, Time_after_lecture_start: 20 },
    rooms: [
      { id: "1", room: "10.2.33" },
      { id: "2", room: "10.2.35" },
    ],
    devices: [
      { device_id: "WP500-Q24A0101", room_id: "1" },
      { device_id: "WP500-Q24A0102", room_id: "2" },
    ],
    courses: [{ id: "1", subject: "INFS", course_num: "1201", title: "Computer Programming" }],
    sections: [
      { id: "7", academic_year: 2026, semester: 1, course_id: "1", room_id: "1", section: "A", instructor: "Dr. S. Khalil" },
    ],
    lectures: [
      { id: "11", schedule_id: "7", lecture_date: "2026-10-25", start_time: "08:00", end_time: "09:15" },
      { id: "12", schedule_id: "7", lecture_date: "2026-10-27", start_time: "08:00", end_time: "09:15" },
    ],
    attendance: [
      {
        lecture_id: "11",
        student_id: 60301234,
        status: "present",
        scan_time: "2026-10-25T05:12:30.000Z",
        late_minutes: null,
        reason: REASONS.late,
      },
      {
        lecture_id: "12",
        student_id: 60301234,
        status: "absent",
        scan_time: null,
        late_minutes: null,
        reason: REASONS.absent,
      },
    ],
    time_logs: [
      // 08:12:30 Doha, counted late on the 25th
      { id: "100", device_id: "WP500-Q24A0101", time: "2026-10-25T05:12:30.000Z", student_palm: "PV-0A1B2C3D" },
      // 08:35 Doha on the 27th: past the 20-minute cutoff
      { id: "101", device_id: "WP500-Q24A0101", time: "2026-10-27T05:35:00.000Z", student_palm: "PV-0A1B2C3D" },
      // a corridor reader that was never linked to a room
      { id: "102", device_id: "WP500-Q24A0107", time: "2026-10-27T05:36:00.000Z", student_palm: "PV-0A1B2C3D" },
    ],
  };
}

const after = dohaInstant("2026-10-28", "12:00");

describe("API dataset", () => {
  it("converts the overview into the app's tables", () => {
    const data = datasetFromOverview(overview());
    expect(data.source).toBe("api");
    expect(data.semester).toMatchObject({ label: "Fall 2026", start: "2026-10-25", end: "2026-10-27" });
    expect(data.sections[0]).toMatchObject({ id: 7, days: [0, 2], start_time: "08:00", end_time: "09:15" });
    expect(data.lectures[0].start).toBe(dohaInstant("2026-10-25", "08:00"));
    expect(data.serverParams).toEqual({ before: 10, after: 20 });
    expect(data.logsAt(dohaInstant("2026-10-26", "00:00"))).toHaveLength(1);
  });

  it("shows the server's attendance under the server's rules", () => {
    const model = buildModel(after, { before: 10, after: 20 }, datasetFromOverview(overview()));
    expect(model.official).toBe(true);
    expect(model.student.name).toBe("Omar Haddad");
    expect(model.palm?.templateRef).toBe("2C3D");
    expect(model.lectures.map((v) => v.status)).toEqual(["late", "absent"]);
    expect(model.lectures[0].lateBy).toBe(12);
  });

  it("explains each scan, including the unmapped one", () => {
    const model = buildModel(after, { before: 10, after: 20 }, datasetFromOverview(overview()));
    expect(model.scans.map((s) => s.outcome.kind)).toEqual(["unmapped", "too_late", "counted"]);
    expect(model.lectures[1].rejected?.outcome.kind).toBe("too_late");
  });

  it("recalculates when the viewer tries other rules", () => {
    const model = buildModel(after, { before: 10, after: null }, datasetFromOverview(overview()));
    expect(model.official).toBe(false);
    expect(model.lectures.map((v) => v.status)).toEqual(["late", "late"]);
  });

  it("handles a student whose palm was never linked", () => {
    const o = { ...overview(), palm_reg: [], time_logs: [], attendance: [] };
    const model = buildModel(after, { before: 10, after: 20 }, datasetFromOverview(o));
    expect(model.palm).toBeNull();
    expect(model.scans).toEqual([]);
    expect(model.lectures.every((v) => v.status === "absent")).toBe(true);
  });

  it("falls back to course codes and placeholder names when SIS fields are missing", () => {
    const o = overview();
    o.student = { student_id: 60301234, name: null, program: null };
    o.courses[0].title = null;
    o.courses[0].subject = "INF ";
    o.sections[0].instructor = null;
    const data = datasetFromOverview(o);
    expect(data.student.name).toBe("Student 60301234");
    expect(data.courses[0]).toMatchObject({ subject: "INF", title: "INF 1201" });
    expect(data.sections[0].instructor).toBe("Instructor not listed");
  });

  it("labels a lecture and its lab by section", () => {
    const o = overview();
    o.sections.push({ ...o.sections[0], id: "8", section: "L1" });
    const model = buildModel(after, { before: 10, after: 20 }, datasetFromOverview(o));
    expect(model.sections.map((s) => s.code)).toEqual(["INFS 1201 A", "INFS 1201 L1"]);
  });

  it("rounds a just-too-late scan up past the cutoff", () => {
    const o = overview();
    o.time_logs = [{ id: "100", device_id: "WP500-Q24A0101", time: "2026-10-25T05:20:30.000Z", student_palm: "PV-0A1B2C3D" }];
    const model = buildModel(after, { before: 10, after: 20 }, datasetFromOverview(o));
    expect(model.scans[0].outcome).toMatchObject({ kind: "too_late", minutes: 21 });
  });
});

