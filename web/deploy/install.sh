#!/usr/bin/env bash
# Install a built release of the Next.js exam prep on this server (NEXTJS-PLAN.md, step 5):
# the image web/build.sh made into svc-lfdln-apps's rootless store, the Quadlet unit, a restart,
# the health check, then verify-examprep-next.sh. A failed start or verify puts the previous
# release back. Signed-in progress (NEXTJS-PLAN.md S3-5): the database's passwords (made by the lfdln
# panel's appdb, /etc/lfdln-appdb/examprep_*.pass) become svc-lfdln-apps' podman secrets, and the
# migrations run in the new image, as examprep_owner, before it starts. Migrations only go forward:
# putting an older release back leaves guests' pages working and its progress answering 503.
#   web/build.sh                      (as momolig: the tests, release/, the image)
#   sudo web/deploy/install.sh        (installs release/'s image)
# The first run also makes svc-lfdln-apps (lingering, its own subuid range) and
# /srv/lfdln-projects/examprep/. It touches nothing else: no nginx, no other service, no panel;
# the lfdln panel's service route sends a host here (see "Step 5: as built" in the plan).
set -euo pipefail
here=$(dirname "$(readlink -f "$0")")
web=$(dirname "$here")

SVC=svc-lfdln-apps
SVC_HOME=/var/lib/$SVC
PROJ=/srv/lfdln-projects/examprep
PORT=4101
UNIT=examprep
KEEP=3

say() { printf '%-4s %s\n' "$1" "$2"; }
die() { say FAIL "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "run with sudo: sudo $0"
BUILDER=${SUDO_USER:-}
[[ -n $BUILDER && $BUILDER != root ]] || die "run with sudo from the account that ran build.sh (its podman has the image)"
[[ -f $web/release/BUILD ]] || die "no release: run web/build.sh first (as $BUILDER)"
ID=$(tail -1 "$web/release/BUILD")
[[ $ID =~ ^[0-9a-f]{16}$ ]] || die "release/BUILD doesn't end with a release id"
IMAGE=localhost/examprep:$ID

# podman as a user: their own runtime dir, from / (root's cwd may not be theirs to read)
as() { local u=$1; shift; (cd / && runuser -u "$u" -- env XDG_RUNTIME_DIR="/run/user/$(id -u "$u")" HOME="$(getent passwd "$u" | cut -d: -f6)" "$@"); }
uctl() { systemctl --user -M "$SVC@" "$@"; }

as "$BUILDER" podman image exists "$IMAGE" || die "$BUILDER's podman has no $IMAGE: run web/build.sh (without --no-image)"
say ok "release $ID ($(head -1 "$web/release/BUILD"))"

# ---------------------------------------------------------------- 1. the user (first run only)
if ! id "$SVC" &>/dev/null; then
    useradd --system --home-dir "$SVC_HOME" --create-home --shell /usr/sbin/nologin "$SVC"
    say ok "made $SVC"
fi
chmod 750 "$SVC_HOME"
for f in /etc/subuid /etc/subgid; do
    grep -q "^$SVC:" "$f" && continue
    # the next free range after every range in both files
    start=$(cat /etc/subuid /etc/subgid | awk -F: '{e=$2+$3; if (e>m) m=e} END {print m}')
    (( start >= 100000 )) || die "can't work out a free subordinate id range"
    if [[ $f == /etc/subuid ]]; then usermod --add-subuids "$start-$((start + 65535))" "$SVC"
    else usermod --add-subgids "$start-$((start + 65535))" "$SVC"; fi
    say ok "$SVC: ${f#/etc/} $start-$((start + 65535))"
done
loginctl enable-linger "$SVC"
uid=$(id -u "$SVC")
for _ in $(seq 50); do [[ -d /run/user/$uid ]] && break; sleep 0.2; done
[[ -d /run/user/$uid ]] || die "$SVC's user manager didn't start (linger)"

install -d -o root -g root -m 755 /srv/lfdln-projects "$PROJ" "$PROJ/releases"
install -d -o "$SVC" -g "$SVC" -m 750 "$PROJ/logs"

# ---------------------------------------------------------------- 2. the image, and the way back
prev=$(as "$SVC" podman image inspect --format '{{.Id}}' localhost/examprep:prod 2>/dev/null || true)
as "$BUILDER" podman save "$IMAGE" | as "$SVC" podman load -q >/dev/null || die "loading the image into $SVC's podman failed (nothing changed)"

# ---------------------------------------------------------------- 2b. the database: secrets, then migrations
APPDB_PASS=/etc/lfdln-appdb
for r in examprep_app examprep_owner; do
    [[ -s $APPDB_PASS/$r.pass ]] || die "no $APPDB_PASS/$r.pass: install the lfdln panel first (its appdb makes exam prep's database and roles)"
done
secret() { as "$SVC" podman secret create --replace "$1" - >/dev/null < "$2" || die "couldn't make the podman secret $1"; }
secret examprep-db "$APPDB_PASS/examprep_app.pass"
secret examprep-db-owner "$APPDB_PASS/examprep_owner.pass"
say ok "secrets examprep-db, examprep-db-owner in $SVC's podman (from $APPDB_PASS)"
# in the new image, before anything is switched: a refused migration changes nothing
as "$SVC" podman run --rm --name examprep-migrate --network slirp4netns:allow_host_loopback=true --read-only \
    --secret examprep-db-owner,mode=0400,uid=1000 --cap-drop=all --security-opt no-new-privileges \
    "$IMAGE" node db/migrate.mjs | sed 's/^/     /' || die "the migrations failed (the running release is untouched)"
say ok "examprep's tables are this release's (web/migrations)"
[[ -z $prev ]] || as "$SVC" podman tag "$prev" localhost/examprep:previous
as "$SVC" podman tag "$IMAGE" localhost/examprep:prod
install -d -o root -g root -m 755 "$PROJ/releases/$ID"
install -m 644 -o root -g root "$web/release/BUILD" "$PROJ/releases/$ID/BUILD"
say ok "image $IMAGE in $SVC's podman, tagged prod${prev:+ (the one before: previous)}"
# its privileges and roles (pammy-panel.json), where the lfdln panel's services helper reads
# them for the Access page's Read again (the panel's docs/roles-plan.md step 6, S6-4)
if [[ -f $web/release/pammy-panel.json ]]; then
    install -d -o root -g root -m 755 /etc/lfdln-projects /etc/lfdln-projects/examprep
    install -m 644 -o root -g root "$web/release/pammy-panel.json" /etc/lfdln-projects/examprep/pammy-panel.json
    say ok "pammy-panel.json in /etc/lfdln-projects/examprep (the panel reads it on Read again)"
else
    say note "this release has no pammy-panel.json (built before it had one)"
fi

# ---------------------------------------------------------------- 3. the unit
qdir=$SVC_HOME/.config/containers/systemd
install -d -o "$SVC" -g "$SVC" -m 700 "$SVC_HOME/.config" "$SVC_HOME/.config/containers" "$qdir"
install -m 644 -o "$SVC" -g "$SVC" "$here/examprep.container" "$qdir/examprep.container"
back() {
    if [[ -n $prev ]]; then
        as "$SVC" podman tag "$prev" localhost/examprep:prod
        uctl restart "$UNIT.service" || true
        die "$1; the release before is back ($(curl -fsS "http://127.0.0.1:$PORT/api/health" 2>/dev/null || echo 'not answering'))"
    fi
    die "$1; there was no release before this one (it stays installed, not working)"
}
uctl daemon-reload
uctl restart "$UNIT.service" || back "$UNIT.service didn't start"


# ---------------------------------------------------------------- 4. healthy, and this release
ok=
for _ in $(seq 60); do
    got=$(curl -fsS --max-time 2 "http://127.0.0.1:$PORT/api/health" 2>/dev/null || true)
    [[ $got == *"\"release\":\"$ID\""* ]] && { ok=1; break; }
    sleep 1
done
[[ -n $ok ]] || back "the new release didn't answer /api/health as $ID within 60s"
say ok "$UNIT.service answering on 127.0.0.1:$PORT as $ID"

# ---------------------------------------------------------------- 5. verify
"$here/verify-examprep-next.sh" --release "$ID" || back "verify failed"

# ---------------------------------------------------------------- 6. keep the last $KEEP
mapfile -t olds < <(ls -1t "$PROJ/releases" | tail -n +$((KEEP + 1)))
for o in "${olds[@]}"; do
    [[ $o =~ ^[0-9a-f]{16}$ ]] || continue
    rm -rf -- "${PROJ:?}/releases/$o"
    as "$SVC" podman rmi -i "localhost/examprep:$o" >/dev/null 2>&1 || true
done
say ok "installed $ID (releases kept: $(ls -1 "$PROJ/releases" | wc -l))"
