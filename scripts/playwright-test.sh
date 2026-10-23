#!/bin/bash
# Runs `playwright test` with the given arguments.
# With PLAYWRIGHT_IN_DOCKER=1 (CI), it runs in the official Playwright image,
# whose browsers and system libraries are already installed: no apt-get on a
# slow Ubuntu mirror. The image version is the installed @playwright/test one.
set -e

if [ "$PLAYWRIGHT_IN_DOCKER" != "1" ]; then
    exec npx playwright test "$@"
fi

version=$(node -p "require('./node_modules/@playwright/test/package.json').version")
image="mcr.microsoft.com/playwright:v${version}-noble"

# Host network: the tests reach the app and the services on localhost.
# The browsers run as root, as in the image; the reports are then given
# back to the current user.
owner="$(id -u):$(id -g)"
exec docker run --rm --network host --ipc host \
    -v "$PWD":/work -w /work \
    -e CI -e PLAYWRIGHT_WORKERS -e OWNER="$owner" \
    "$image" sh -c 'npx playwright test "$@"; status=$?
        chown -R "$OWNER" playwright-report test-results 2>/dev/null
        exit $status' playwright-test "$@"
