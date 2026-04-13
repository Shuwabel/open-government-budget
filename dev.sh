#!/bin/bash
# Clean dev script that filters out annoying Next.js warnings
next dev --turbo 2>&1 | grep -v "Warning:" | grep -v "⚠" | grep -v "Invalid next.config" | grep -v "Unrecognized key" | grep -v "lockfile" | grep -v "Detected additional" | grep -v "inferred your workspace root" || exec next dev --turbo "$@"

