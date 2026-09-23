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

## First releases

September 23, 2026. Registration was additive at plan digest `bbc416e457c4bcacb935be6ac958677c11e28bfd067e7a75ec284aa2dc1f5f34`: one allowlist entry, one app env file, one topology entry. The manager was restarted only after confirming an idle release lane, and the existing routes were re-probed.

- Commit `1f124bc`, [workflow 35917822417](https://github.com/urep-student-attendance/mobile-app/actions/runs/35917822417) (manual dispatch), job `e40d4866-75b3-4976-83f9-3fa64d566e8c`: `succeeded`.
- Commit `f2e0c60b006d9f4755bc89fd827ffd9ce13f1196`, [workflow 35918052330](https://github.com/urep-student-attendance/mobile-app/actions/runs/35918052330) (push), job `caa137d5-13f4-4f6a-b727-de76133ca780`: `succeeded`. The loopback `/version.json` matched this commit; the image is `urep-attendance:f2e0c60…`.

Public route: the Cloudflare proxied A record `attendance` → `107.172.137.190` was added in the dashboard, and the Caddy block (between `# BEGIN/END UREP ATTENDANCE`) was validated against the full Caddyfile before reload. Backups: `/etc/caddy/Caddyfile.before-urep-attendance-20260923` and `/etc/deploy-manager/deploy-manager.env.before-urep-attendance-20260923`. Let's Encrypt issued the certificate on first request. Public HTTPS `/healthz` returned 200 and `/version.json` reported `f2e0c60…`; assets, CSP and `X-Frame-Options` were intact through Cloudflare.

A resolver that looked the name up before the record existed (for example the ProtonVPN resolver) can keep returning "does not exist" for up to Cloudflare's 30-minute negative TTL.

Rollback uses the previous SHA-tagged image through Deploy Manager's release mechanism. Always check the live `/version.json` and the terminal receipt rather than trusting this file.
