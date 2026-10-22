# UDST Attendance, student app

The app UDST students use to see their attendance from the PALM readers, built for the UREP 32 student attendance research project at the University of Doha for Science and Technology. It is published as a web app first, with a store release to follow.

**Preview:** https://attendance.alirezaafshan.com/

It reads from the [attendance API](https://github.com/urep-student-attendance/attendance-api) when one is configured, and otherwise runs on a fictional demo student shaped like the API's tables. Until the WavePass500 readers are connected, the API is fed by its palm reader simulator, so every student there is simulated.

Signed in through the API, the app shows the attendance the server recorded. The attendance rules are a direct port of the API's processing, so trying other values for `Time_before_lecture_start` or `Time_after_lecture_start` in the preview recalculates every class exactly as the server would.

## Screens

- **Today**: overall attendance, courses below the minimum, today's classes with their live scan window, and the latest scans.
- **Courses**: attendance per section, how many absences are left, and every class with its status and reason.
- **Scans**: every palm scan the readers recorded and whether it counted: on time, late, too early, too late, wrong room, duplicate, or from a reader not linked to a room.
- **Profile**: palm registration status and the attendance rules in plain language.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # typecheck + tests + production build
npm start        # serve dist/ on :8080
```

To use a running attendance API, set `ATTENDANCE_API_URL` for either server. Both proxy it under `/api`, so the app stays same-origin:

```bash
ATTENDANCE_API_URL=http://localhost:3000 npm run dev
ATTENDANCE_API_URL=http://localhost:3000 npm start
```

Seed and simulate in the API repo (`npm run sim -- seed --from 2026-08-30 --to 2026-12-10`, then `npm run sim -- day --date …` for each day), and sign in with a student ID from `npm run sim -- campus`. Without `ATTENDANCE_API_URL`, or when the API is unreachable, the sign-in screen offers the demo student.

Requires Node 22+.
