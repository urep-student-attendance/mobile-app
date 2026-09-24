<!-- al-stack:project:start -->
## Al-stack project

Project: urep-mobile-app. Profile: web. Status: experimental.

Student attendance app for the UREP PALM reader project, published as a web preview

`al-stack.toml` records this project's setup and dependencies. Work from the checkout selected for the task; other branches/worktrees are optional history. Use `al-stack register .` once when starting work here. Local registration does not change the project's lifecycle.

Project commands:
- dev: `npm run dev`
- check: `npm run check`
- start: `npm start`

Edit project guidance outside this managed section. Use `al-stack configure` for its fields and `al-stack check .` for setup checks. Run the actual project checks for behavioral validation.
<!-- al-stack:project:end -->

## UREP student attendance app

Student-facing app for the UREP 32 PALM reader attendance project (UDST). Alireza Afshan is the mobile app lead. The supervisors asked for a web version first so the team can use it before a store release. Public preview: https://attendance.alirezaafshan.com/

### Run and check

- `npm install`, then `npm run dev` for Vite on port 5173.
- `npm run check` runs the typecheck, the Vitest suite and the production build. CI and the Docker build run the same command.
- `npm start` serves `dist/` through `server.mjs` on `PORT` (default 8080), with `/healthz` and `/version.json`.

### Architecture and decisions

- React 19 + Vite + TypeScript. Web first; the store build is planned as a Capacitor wrapper of this same codebase, so avoid browser-only APIs without a fallback.
- `src/domain/` mirrors the attendance-api schema (`github.com/urep-student-attendance/attendance-api`). `pipeline.ts` is a client port of the API's mapping and attendance SQL. Keep the rules and reason strings identical. `pipeline.test.ts` holds the parity scenarios.
- The app runs on deterministic, fictional demo data (`demo.ts`) until the API is hosted. Replace `buildModel`'s inputs with API calls instead of changing screens.
- All times are Asia/Qatar (fixed UTC+3), whatever the viewer's timezone.
- `MIN_ATTENDANCE_PERCENT` (85%) is a proposed parameter. It is not in the API yet.
- UDST theme (requested by the PI, Dr. Wagdi): palette and Lato typeface from udst.edu.qa (`--brand: #0055b8`), with the Arabic name in Noto Kufi Arabic. The official UDST logo is not used; get the approved asset from UDST communications before adding it. The preview must say it is a research preview, not an official UDST service.
- There is no password field while the app is hosted outside a UDST domain. A UDST-branded password prompt on another domain would look like phishing. Real sign-in will use UDST accounts.
- Hash routes (`#/courses/2`) keep the static server simple and work inside the desktop phone frame.
- The server's CSP is `'self'` only. Do not add inline scripts, inline `<style>`, or third-party assets.

### Acceptance

The desktop layout shows the project brief and the app in a phone frame; narrow screens show the app full screen with the brief at `#/about`. The rules controls recompute every screen. There is no horizontal overflow at 375px, and light and dark themes both work.

### Deployment

Deploy Manager on Alireza's VPS releases validated `main` commits; see `docs/deployment.md`. Use the user-level `vps-operations` skill for server work. The Cloudflare DNS record is proxied. DNS changes go through the Cloudflare MCP server (`https://mcp.cloudflare.com/mcp`) when it is connected, or the Cloudflare dashboard.
