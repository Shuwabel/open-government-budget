#!/bin/bash
# Suppress Next.js warnings
export NEXT_TELEMETRY_DISABLED=1
exec next dev --turbo "$@" 2>&1 | grep -v "Warning:" | grep -v "⚠" | grep -v "Invalid next.config" | grep -v "Unrecognized key" | grep -v "lockfile" | grep -v "Detected additional" || true

