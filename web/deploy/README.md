# Running the Next.js exam prep on the server (step 5, guest-only)

The container runs as `svc-lfdln-apps` on 127.0.0.1:4101. The lfdln panel sends a host to it through
a service route. See NEXTJS-PLAN.md, "Hosting" and "Step 5: as built".

## Install or update (as momolig)

```bash
cd ~/apps/placement-exam-prep-nextjs/web
./build.sh                                  # the tests, release/, the image localhost/examprep:<id>
sudo ./deploy/install.sh                    # into svc-lfdln-apps, restart, health, verify; failure = previous back
```

The first install also makes `svc-lfdln-apps` and `/srv/lfdln-projects/examprep/`.

## The test host (once, after the first install)

1. **The lfdln panel adopts the service.** Add this to `KNOWN` in
   `pammy-setup/panel/packages/services/src/known.ts`, then install the lfdln panel (its step 6b
   adopts it):

   ```ts
   {
     id: 'examprep',
     title: 'Placement Exam Prep',
     user: 'svc-lfdln-apps',
     about: 'examprep.lesfleursdelanuit.com (Next.js, guest-only). Code and runbook: ~momolig/apps/placement-exam-prep-nextjs (web/deploy/README.md).',
     parts: [
       { id: 'web', title: 'Exam prep (Next.js)', unit: 'examprep', port: 4101, health: '/api/health', controls: true, requires: [] },
     ],
   },
   ```

2. **Add the host.** On panel.lesfleursdelanuit.com, go to Hosts, add the host `examprep-next`, and
   add a route at `/` to the service Placement Exam Prep / web.

3. **Check it:**

   ```bash
   sudo ./deploy/verify-examprep-next.sh --host examprep-next.lesfleursdelanuit.com
   E2E_BASE_URL=https://examprep-next.lesfleursdelanuit.com npx playwright test
   ```

`examprep.lesfleursdelanuit.com` stays on its site folder until step 6.

## Look after it

```bash
U='sudo systemctl --user -M svc-lfdln-apps@'
$U status examprep.service
$U restart examprep.service
sudo journalctl _SYSTEMD_USER_UNIT=examprep.service _UID=$(id -u svc-lfdln-apps) -n 50
curl -s http://127.0.0.1:4101/api/health    # {"ok":true,"release":"<id>"}
```

**The way back:** `install.sh` tags the release before as `previous`. To put it back by hand:

```bash
sudo -u svc-lfdln-apps XDG_RUNTIME_DIR=/run/user/$(id -u svc-lfdln-apps) podman tag localhost/examprep:previous localhost/examprep:prod
$U restart examprep.service
```
