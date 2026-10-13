#!/usr/bin/env bash
# Check Google Scholar, and when something changed: test, build, commit, push and publish.
# Run by hand or weekly by launchd (scripts/install_schedule.sh). Needs no arguments.
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$(dirname "$0")/.."

git pull -q --ff-only origin main
if ! python3 scripts/sync_scholar.py; then
  echo "Scholar not reachable; will try again next run."
  exit 0
fi
git diff --quiet -- src/data/scholar-sync.json && { echo "Nothing to publish."; exit 0; }

npm ci --silent
npm test
git add src/data/scholar-sync.json
git commit -q -m "Sync Google Scholar: new papers and metrics

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push -q origin main
scripts/deploy.sh
