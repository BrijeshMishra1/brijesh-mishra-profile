#!/usr/bin/env python3
"""Sync the profile from Google Scholar and push it; GitHub Actions publishes the site. Works on macOS, Linux and Windows.

Needs only Python 3.9+, git and Node.js on PATH, and push access to the repo.
Usage:  python3 scripts/sync_and_publish.py [--no-publish]
It can be run from any clone (or a fresh `git clone`) on any network.
"""
import pathlib, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = "src/data/scholar-sync.json"
TRAILER = "\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"


def run(*cmd, cwd=ROOT, check=True, capture=False):
    exe = shutil.which(cmd[0])
    if exe is None:
        sys.exit(f"'{cmd[0]}' was not found on PATH; install it and run again.")
    r = subprocess.run([exe, *cmd[1:]], cwd=cwd, check=check, text=True,
                       capture_output=capture)
    return r


def main() -> int:
    publish = "--no-publish" not in sys.argv
    run("git", "pull", "-q", "--ff-only", "origin", "main")
    code = subprocess.run([sys.executable, str(ROOT / "scripts" / "sync_scholar.py")]).returncode
    if code != 0:
        print("Could not read Google Scholar or OpenAlex; try again later.")
        return 0
    if run("git", "diff", "--quiet", "--", DATA, check=False).returncode == 0:
        print("Nothing to publish.")
        return 0
    if not publish:
        print(f"Updated {DATA}; not committed (--no-publish).")
        return 0
    run("npm", "ci", "--silent")
    run("npm", "test")
    run("git", "add", DATA)
    run("git", "commit", "-q", "-m", "Sync Google Scholar: new papers and metrics" + TRAILER)
    run("git", "push", "-q", "origin", "main")
    print("Pushed. GitHub Actions rebuilds and publishes the site within a minute or two.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
