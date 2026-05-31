#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEY="${GITHUB_PAGES_DEPLOY_KEY:-$HOME/.ssh/mrteax_github_pages_ed25519}"
REMOTE="${GITHUB_PAGES_REMOTE:-git@github.com:mrteax/mrteax.github.io.git}"
BRANCH="${GITHUB_PAGES_BRANCH:-master}"
MESSAGE="${1:-Update GitHub Pages site}"

cd "$ROOT"

if [[ ! -f "$KEY" ]]; then
  echo "Missing deploy key: $KEY" >&2
  echo "Create it with: ssh-keygen -t ed25519 -C 'mrteax.github.io deploy key' -f '$KEY' -N ''" >&2
  exit 1
fi

if ! git diff --quiet --exit-code || ! git diff --cached --quiet --exit-code || [[ -n "$(git status --porcelain)" ]]; then
  git add .
  git diff --cached --check
  git commit -m "$MESSAGE"
else
  echo "No local changes to commit."
fi

GIT_SSH_COMMAND="ssh -i $KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new" \
  git push "$REMOTE" "HEAD:$BRANCH"

echo "Published: https://mrteax.github.io/"
