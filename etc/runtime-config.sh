#!/bin/sh
# Container start (run by the nginx image from /docker-entrypoint.d): writes
# config.js and the security headers from the VITE_* variables of the
# container. A variable not given keeps its value of the build (build.env,
# written by scripts/runtime-config.mjs): a container started without
# variables serves exactly what the build gave (SPC-2026-11-18-001). A
# variable given empty empties the value (the kit turns Google sign-in off).
set -eu
# A pipeline fails when one of its commands fails, where the shell allows it
# (the ash of the image does): a killed command then stops the start instead
# of writing an empty value.
if (set -o pipefail) 2>/dev/null; then set -o pipefail; fi

dir="${RUNTIME_CONFIG_DIR:-/etc/nginx/variamos}"
config_js="${RUNTIME_CONFIG_JS:-/usr/share/nginx/html/config.js}"
headers="${RUNTIME_SECURITY_HEADERS:-/etc/nginx/security-headers.conf}"

# shellcheck source=/dev/null
. "$dir/build.env"

nl='
'
cr="$(printf '\r')"

# Sets replaced to $1 with every $2 replaced by $3. Plain shell, with no
# command run: no process that could die and leave a value silently empty.
replace_all() {
  replaced=""
  rest="$1"
  while :; do
    case "$rest" in
      *"$2"*)
        replaced="$replaced${rest%%"$2"*}$3"
        rest="${rest#*"$2"}"
        ;;
      *)
        replaced="$replaced$rest"
        return
        ;;
    esac
  done
}

# Sets value to the value of the container when it is set, even empty, else
# to the value of the build, on one line. The names come from build.env.
value_of() {
  case "$1" in *[!A-Z0-9_]*) echo "runtime-config: bad name $1" >&2; exit 1 ;; esac
  eval "value=\${$1-\${BUILD_$1-}}"
  replace_all "$value" "$cr" ""
  replace_all "$replaced" "$nl" ""
  value="$replaced"
}

# Sets json to $1 as a JavaScript string.
json_string() {
  replace_all "$1" '\' '\\'
  replace_all "$replaced" '"' '\"'
  json="\"$replaced\""
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
  value_of "$name"
  json_string "$value"
  entries="$entries${entries:+,}\"$name\":$json"
done
printf 'window.__VARIAMOS_CONFIG__ = {%s};\n' "$entries" > "$config_js"

origins=""
for name in $API_VARIABLES; do
  value_of "$name"
  origin="$(origin_of "$value")"
  [ -z "$origin" ] || origins="$origins$origin
"
done
list="$(printf '%s' "$origins" | LC_ALL=C sort -u | tr '\n' ' ' | sed 's/ $//')"
escaped="$(printf '%s' "$list" | sed 's/[&|\\]/\\&/g')"
sed "s| __API_ORIGINS__|${escaped:+ $escaped}|" \
  "$dir/security-headers.conf.template" > "$headers"

echo "runtime-config: config.js and security headers written"
