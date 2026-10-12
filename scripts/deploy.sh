#!/usr/bin/env bash
# Publish the production build to the gh-pages branch of the origin remote.
# Usage: scripts/deploy.sh   (run from the project root, after committing)
set -euo pipefail

remote="$(git remote get-url origin)"
npm run build
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cp -R dist/. "$tmp"/
touch "$tmp/.nojekyll"
(
  cd "$tmp"
  git init -q -b gh-pages
  git add -A
  git -c user.name="$(git -C "$OLDPWD" config user.name)" \
      -c user.email="$(git -C "$OLDPWD" config user.email)" \
      commit -q -m "Publish site build"
  git push -f "$remote" gh-pages
)
echo "Published. Live in about a minute at the repository's GitHub Pages URL."
