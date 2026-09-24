# UDST Attendance, student app

The app UDST students use to see their attendance from the PALM readers, built for the UREP 32 student attendance research project at the University of Doha for Science and Technology. It is published as a web app first, with a store release to follow.

**Preview:** https://attendance.alirezaafshan.com/

It currently runs on fictional demo data shaped like the [attendance API](https://github.com/urep-student-attendance/attendance-api) tables. The attendance rules are a direct port of the API's processing, so changing `Time_before_lecture_start` or `Time_after_lecture_start` in the preview gives the same results the server would.

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

Requires Node 22+.
