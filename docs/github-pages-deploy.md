# GitHub Pages Deploy Setup

This repository is published at <https://mrteax.github.io/>.

## One-Time Setup

Use a dedicated GitHub deploy key for this repository. This keeps publishing scoped to `mrteax/mrteax.github.io` instead of using a personal SSH key or a long-lived token.

1. Generate the key on the devbox:

   ```bash
   ssh-keygen -t ed25519 -C "mrteax.github.io deploy key" -f "$HOME/.ssh/mrteax_github_pages_ed25519" -N ""
   chmod 600 "$HOME/.ssh/mrteax_github_pages_ed25519"
   chmod 644 "$HOME/.ssh/mrteax_github_pages_ed25519.pub"
   ```

2. Copy the public key:

   ```bash
   python3 - <<'PY'
   from pathlib import Path
   print(Path.home().joinpath(".ssh/mrteax_github_pages_ed25519.pub").read_text().strip())
   PY
   ```

3. Add it in GitHub:

   - Open `mrteax/mrteax.github.io`.
   - Go to `Settings` -> `Deploy keys`.
   - Click `Add deploy key`.
   - Title: `devbox mrteax.github.io deploy key`.
   - Paste the public key.
   - Enable `Allow write access`.
   - Save.

## Publish Changes

After editing files:

```bash
./scripts/deploy-pages.sh "Update site"
```

The script will:

- stage all local changes;
- run `git diff --cached --check`;
- create a commit if needed;
- push to `master` using the dedicated deploy key.

## Useful Links

- Homepage: <https://mrteax.github.io/>
- France Schengen guide: <https://mrteax.github.io/france-schengen-2026.html>

## Privacy Rule

Do not publish private visa information to GitHub Pages. Keep names, passport numbers, company names, school names, phone numbers, emails, bank statements, visa numbers and application IDs in local-only files.
