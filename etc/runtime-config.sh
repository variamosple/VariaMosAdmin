#!/bin/sh
# Container start (run by the nginx image from /docker-entrypoint.d): writes
# config.js and the security headers from the VITE_* variables of the
# container. A variable not given keeps its value of the build (build.env,
# written by scripts/runtime-config.mjs): a container started without
# variables serves exactly what the build gave (SPC-2026-11-18-001). A
# variable given empty empties the value (the kit turns Google sign-in off).
set -eu

dir="${RUNTIME_CONFIG_DIR:-/etc/nginx/variamos}"
config_js="${RUNTIME_CONFIG_JS:-/usr/share/nginx/html/config.js}"
headers="${RUNTIME_SECURITY_HEADERS:-/etc/nginx/security-headers.conf}"

# shellcheck source=/dev/null
. "$dir/build.env"

# Value of the container when it is set, even empty, else of the build. The
# names come from build.env.
value_of() {
  case "$1" in *[!A-Z0-9_]*) echo "runtime-config: bad name $1" >&2; exit 1 ;; esac
  eval "printf '%s' \"\${$1-\${BUILD_$1-}}\"" | tr -d '\r\n'
}

json_string() {
  printf '"%s"' "$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g')"
}

# Origin of an http(s) or ws(s) address, as new URL(...).origin gives it;
# nothing for a relative address, which 'self' covers.
origin_of() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' \
    | sed -nE 's#^((https?|wss?)://)([^/?#@]*@)?([^/?#]+).*#\1\4#p' \
    | sed -E 's#^(https|wss)://([^/]+):443$#\1://\2#; s#^(http|ws)://([^/]+):80$#\1://\2#'
}

entries=""
for name in $RUNTIME_VARIABLES; do
  entries="$entries${entries:+,}\"$name\":$(json_string "$(value_of "$name")")"
done
printf 'window.__VARIAMOS_CONFIG__ = {%s};\n' "$entries" > "$config_js"

origins=""
for name in $API_VARIABLES; do
  origin="$(origin_of "$(value_of "$name")")"
  [ -z "$origin" ] || origins="$origins$origin
"
done
list="$(printf '%s' "$origins" | LC_ALL=C sort -u | tr '\n' ' ' | sed 's/ $//')"
escaped="$(printf '%s' "$list" | sed 's/[&|\\]/\\&/g')"
sed "s| __API_ORIGINS__|${escaped:+ $escaped}|" \
  "$dir/security-headers.conf.template" > "$headers"

echo "runtime-config: config.js and security headers written"
