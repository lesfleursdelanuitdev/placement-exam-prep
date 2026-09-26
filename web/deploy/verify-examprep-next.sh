#!/usr/bin/env bash
# Check the installed Next.js exam prep (NEXTJS-PLAN.md, step 5). install.sh runs it; alone:
#   sudo web/deploy/verify-examprep-next.sh [--release <id>] [--host <name>] [--no-kill] [--no-browser]
# As root, the service checks too (up, enabled, restarts on its own after its container is
# killed). --host also checks every page through nginx at https://<name>, as a visitor gets it.
# The browser checks (an old #/ link forwards; no request leaves the site) run as the account
# that ran sudo, with web/node_modules's Playwright.
# Every page: 200, a CSP with a nonce, the security headers; fonts from this site; 404 works.
set -uo pipefail
here=$(dirname "$(readlink -f "$0")")
web=$(dirname "$here")
SVC=svc-lfdln-apps UNIT=examprep PORT=4101
release= host= kill=1 browser=1
while (( $# )); do
    case $1 in
        --release) release=$2; shift ;;
        --host) host=$2; shift ;;
        --no-kill) kill=0 ;;
        --no-browser) browser=0 ;;
        --base) PORT=; base=$2; shift ;;     # tests: a server somewhere else (no service checks)
        *) echo "unknown option $1" >&2; exit 2 ;;
    esac
    shift
done
base=${base:-http://127.0.0.1:$PORT}

pass=0 fail=0
ok() { pass=$((pass + 1)); printf 'ok   %s\n' "$1"; }
no() { fail=$((fail + 1)); printf 'FAIL %s\n' "$1"; }
check() { local what=$1; shift; if "$@" >/dev/null 2>&1; then ok "$what"; else no "$what"; fi; }

PAGES=(/ /exam /exam/part-1 /exam/part-2 /exam/part-3 /exam/results /tutorials /tutorials/w-motion
    /tutorials/w-motion/examples /tutorials/poly-addsub/practice /flashcards /flashcards/poly-addsub
    /flashcards/section/factoring /flashcards/all /flashcards/review /grapher /grapher/draw /progress)

# ---------------------------------------------------------------- the service (root, on this server)
uctl() { systemctl --user -M "$SVC@" "$@"; }
health() { curl -fsS --max-time 3 "http://127.0.0.1:4101/api/health"; }
if [[ -n $PORT && $EUID -eq 0 ]]; then
    check "$UNIT.service is active" test "$(uctl is-active "$UNIT.service" 2>/dev/null)" = active
    # a Quadlet unit is generated, so "enabled" is its [Install] WantedBy: default.target wants it
    check "$UNIT.service starts with $SVC's user manager (default.target wants it)" \
        bash -c "systemctl --user -M '$SVC@' list-dependencies default.target --plain 2>/dev/null | grep -qw '$UNIT.service'"
    check "$SVC lingers (the service runs with nobody signed in)" test -e "/var/lib/systemd/linger/$SVC"
    uid=$(id -u "$SVC")
    # rootless: the container's node user is a uid from $SVC's subuid range, never root or a real user
    spid=$(cd / && runuser -u "$SVC" -- env XDG_RUNTIME_DIR=/run/user/$uid podman inspect --format '{{.State.Pid}}' "$UNIT" 2>/dev/null)
    suid=$( [[ $spid =~ ^[0-9]+$ ]] && ps -o uid= -p "$spid" | tr -d ' ')
    sub=$(awk -F: -v u="$SVC" '$1==u {print $2, $2+$3-1}' /etc/subuid)
    check "the container runs as a uid from $SVC's subuid range (${suid:-?}), not root" \
        bash -c "[[ -n '$suid' && -n '$sub' ]] && read lo hi <<< '$sub' && (( $suid >= lo && $suid <= hi ))"
    if (( kill )); then
        started=$(uctl show -p ActiveEnterTimestampMonotonic --value "$UNIT.service")
        cid=$(cd / && runuser -u "$SVC" -- env XDG_RUNTIME_DIR=/run/user/$uid podman inspect --format '{{.State.Pid}}' "$UNIT" 2>/dev/null)
        if [[ $cid =~ ^[0-9]+$ ]] && kill -KILL "$cid" 2>/dev/null; then
            back=
            for _ in $(seq 60); do
                sleep 1
                now=$(uctl show -p ActiveEnterTimestampMonotonic --value "$UNIT.service")
                [[ $now != "$started" ]] && health >/dev/null 2>&1 && { back=1; break; }
            done
            [[ -n $back ]] && ok "restarts on its own (server killed; answering again)" || no "restarts on its own (not back within 60s)"
        else
            no "restarts on its own (couldn't find the server's process to kill)"
        fi
    fi
elif [[ -n $PORT ]]; then
    echo "note: not root, so the service checks were skipped (sudo $0)"
fi

# ---------------------------------------------------------------- listening only on 127.0.0.1
if [[ -n $PORT ]]; then
    socks=$(ss -Hltn "sport = :$PORT" | awk '{print $4}' | sort -u | tr '\n' ' ')
    check "port $PORT listens only on 127.0.0.1 ($socks)" bash -c "[[ -n '$socks' ]] && [[ -z \$(echo '$socks' | tr ' ' '\n' | grep -v '^127\.0\.0\.1:$PORT\$' | grep .) ]]"
    h=$(health 2>/dev/null)
    check "/api/health: ok${release:+, release $release}" bash -c "[[ '$h' == *'\"ok\":true'* ]] && [[ -z '$release' || '$h' == *'\"release\":\"$release\"'* ]]"
fi

# ---------------------------------------------------------------- the pages
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
pages() {   # <label> <curl args...> -- the base url is the last arg
    local label=$1; shift
    local at=${*: -1}; local args=("${@:1:$#-1}")
    local bad=() p code hdr
    for p in "${PAGES[@]}"; do
        code=$(curl -sS --max-time 20 "${args[@]}" -D "$tmp/h" -o "$tmp/b" -w '%{http_code}' "$at$p") || code=000
        hdr=$(tr -d '\r' < "$tmp/h" | tr 'A-Z' 'a-z')
        [[ $code == 200 ]] || { bad+=("$p: $code"); continue; }
        grep -q "^content-security-policy: .*script-src 'self' 'nonce-" <<<"$hdr" || bad+=("$p: no CSP with a nonce")
        grep -q "^content-security-policy: .*default-src 'none'" <<<"$hdr" || bad+=("$p: CSP without default-src 'none'")
        grep -q '^strict-transport-security: max-age=' <<<"$hdr" || bad+=("$p: no HSTS")
        grep -q '^x-content-type-options: nosniff' <<<"$hdr" || bad+=("$p: no nosniff")
        grep -q '^referrer-policy: no-referrer' <<<"$hdr" || bad+=("$p: no referrer-policy")
        grep -q '^x-powered-by' <<<"$hdr" && bad+=("$p: X-Powered-By")
        grep -q '<title>' "$tmp/b" || bad+=("$p: no title")
        # nothing loaded from anywhere else: every src/href on the page is this site's own
        grep -oE '(src|href)="(https?:)?//[^"]*"' "$tmp/b" | grep -q . && bad+=("$p: loads from another site: $(grep -oE '(src|href)="(https?:)?//[^"]*"' "$tmp/b" | head -1)")
        grep -qi 'fonts.googleapis\|fonts.gstatic' "$tmp/b" && bad+=("$p: mentions Google Fonts")
    done
    ((${#bad[@]} == 0)) && ok "$label: ${#PAGES[@]} pages 200, CSP with nonce, security headers, nothing from other sites" \
        || no "$label: ${bad[*]}"
    # the fonts: from this site, as fonts
    code=$(curl -sS --max-time 20 "${args[@]}" -o "$tmp/b" -w '%{http_code}' "$at/")
    fonts=$(grep -oE '/_next/static/media/[A-Za-z0-9._-]+\.woff2' "$tmp/b" | sort -u)
    if [[ -z $fonts ]]; then no "$label: fonts (the home page names no .woff2 from this site)"
    else
        fb=()
        for f in $fonts; do
            t=$(curl -sS --max-time 20 "${args[@]}" -o /dev/null -w '%{http_code} %{content_type}' "$at$f")
            [[ $t == "200 font/woff2"* ]] || fb+=("$f: $t")
        done
        ((${#fb[@]} == 0)) && ok "$label: $(wc -w <<<"$fonts") fonts served from this site (font/woff2)" || no "$label: fonts: ${fb[*]}"
    fi
    code=$(curl -sS --max-time 20 "${args[@]}" -o "$tmp/b" -w '%{http_code}' "$at/no-such-page")
    [[ $code == 404 ]] && grep -q 'Page not found' "$tmp/b" && ok "$label: an unknown address is the 404 page" || no "$label: /no-such-page gave $code"
}
pages "direct ($base)" "$base"
[[ -z $host ]] || pages "through nginx (https://$host)" --resolve "$host:443:127.0.0.1" "https://$host"
if [[ -n $host ]]; then
    code=$(curl -sS --max-time 10 --resolve "$host:80:127.0.0.1" -o /dev/null -w '%{http_code} %{redirect_url}' "http://$host/exam")
    [[ $code == "301 https://$host/exam" || $code == "308 https://$host/exam" ]] && ok "http://$host goes to https" || no "http://$host/exam: $code"
fi

# ---------------------------------------------------------------- in a browser
if (( browser )); then
    who=${SUDO_USER:-$(id -un)}
    [[ $who == root ]] && who=
    if [[ -n $who && -d $web/node_modules/@playwright/test ]]; then
        targets=("$base"); [[ -z $host ]] || targets+=("https://$host")
        for t in "${targets[@]}"; do
            if [[ $EUID -eq 0 ]]; then
                out=$(cd "$web" && runuser -u "$who" -- env HOME="$(getent passwd "$who" | cut -d: -f6)" PATH="$PATH" node deploy/check-browser.mjs "$t" ${host:+--resolve "$host"} 2>&1)
            else
                out=$(cd "$web" && node deploy/check-browser.mjs "$t" ${host:+--resolve "$host"} 2>&1)
            fi
            while IFS= read -r l; do
                case $l in ok\ *) ok "browser ($t): $(sed "s/^ok *//" <<<"$l")" ;; FAIL\ *) no "browser ($t): $(sed "s/^FAIL *//" <<<"$l")" ;; *) [[ -z $l ]] || echo "     $l" ;; esac
            done <<<"$out"
        done
    else
        echo "note: browser checks skipped (no web/node_modules/@playwright/test, or run as root without sudo)"
    fi
fi

echo "verify: $pass passed, $fail failed"
(( fail == 0 ))
