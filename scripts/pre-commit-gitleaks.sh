#!/usr/bin/env bash
# Simple pre-commit hook that runs gitleaks on staged changes.
set -e

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks not installed; skipping pre-commit secret check"
  exit 0
fi

# Create temporary tree of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

echo "Running gitleaks on staged files..."
echo "$STAGED_FILES" | xargs gitleaks detect --source-stdin || true

echo "Pre-commit secret scan finished (warnings do not block commit)."
