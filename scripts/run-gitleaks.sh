#!/usr/bin/env bash
set -eu

REPORT_PATH="${1:-gitleaks-report.json}"

# Ensure full history for secret scanning
if [ -d .git ] ; then
  git fetch --unshallow --tags || true
fi

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks not found, downloading to /tmp/gitleaks..."
  GL=/tmp/gitleaks
  curl -sSL https://github.com/zricethezav/gitleaks/releases/latest/download/gitleaks-linux-amd64 -o "$GL"
  chmod +x "$GL"
else
  GL=$(command -v gitleaks)
fi

# Run gitleaks; do not fail the script (caller may treat as warning)
echo "Running gitleaks..."
"$GL" detect --source . --report-path "$REPORT_PATH" --redact || true

if [ -f "$REPORT_PATH" ]; then
  echo "Gitleaks report written to $REPORT_PATH"
else
  echo "No gitleaks report produced"
fi
