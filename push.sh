#!/usr/bin/env bash
set -euo pipefail

# Usage: ./push.sh "some commit message"
# Optional overrides: PUSH_REMOTE, PUSH_BRANCH so you can run with other remotes/branches.

if [ $# -lt 1 ]; then
  echo "Usage: $0 \"commit message\""
  exit 1
fi

PUSH_REMOTE=${PUSH_REMOTE:-origin}
PUSH_BRANCH=${PUSH_BRANCH:-main}

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

git add -A

if git diff --cached --quiet; then
  echo "Nothing to commit. Skipping commit step."
else
  git commit -m "$*"
fi

git push "$PUSH_REMOTE" "$PUSH_BRANCH"
