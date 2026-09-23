# UREP Attendance deployment

Public URL: https://attendance.alirezaafshan.com/

Deploy Manager on Alireza's VPS releases validated `main` commits. The workflow in `.github/workflows/deploy.yml` runs `npm run check` and a Docker build, sends a signed request, checks the accepted SHA, and waits for a terminal receipt.

- App ID and image: `urep-attendance`. Checkout owner: `deploy-manager`.
- Checkout: `/opt/urep-attendance/app`.
- Production/candidate loopback ports: `3250` / `3251`; container: `8080`.
- Readiness: `/healthz`. Public build identity: `/version.json`.
- Application runtime secrets: none. The per-app webhook secret (`UREP_ATTENDANCE_DEPLOY_WEBHOOK_SECRET`) lives in the manager environment and in the repository secret `DEPLOY_WEBHOOK_SECRET`.
- Caddy owns the public route. Cloudflare owns its proxied A record.
- The registration spec is `deploy/fleet.json`, applied additively with Deploy Manager's `scripts/register-app.mjs`.

Rollback uses the previous SHA-tagged image through Deploy Manager's release mechanism. Always check the live `/version.json` and the terminal receipt rather than trusting this file.
