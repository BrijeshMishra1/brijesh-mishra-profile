#!/usr/bin/env python3
"""Sync the profile from Google Scholar and publish it. Works on macOS, Linux and Windows.

Needs only Python 3.9+, git and Node.js on PATH, and push access to the repo.
Usage:  python3 scripts/sync_and_publish.py [--no-publish]
It can be run from any clone (or a fresh `git clone`) on any network.
"""
import json, pathlib, shutil, subprocess, sys, tempfile

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


def publish_pages() -> None:
    """Build and push dist/ to the gh-pages branch (same result as scripts/deploy.sh)."""
    remote = run("git", "remote", "get-url", "origin", capture=True).stdout.strip()
    name = run("git", "config", "user.name", capture=True, check=False).stdout.strip() or "Profile sync"
    email = run("git", "config", "user.email", capture=True, check=False).stdout.strip() or "noreply@example.com"
    run("npm", "run", "build")
    with tempfile.TemporaryDirectory() as tmp:
        out = pathlib.Path(tmp)
        shutil.copytree(ROOT / "dist", out, dirs_exist_ok=True)
        (out / ".nojekyll").touch()
        run("git", "init", "-q", "-b", "gh-pages", cwd=out)
        run("git", "add", "-A", cwd=out)
        run("git", "-c", f"user.name={name}", "-c", f"user.email={email}",
            "commit", "-q", "-m", "Publish site build", cwd=out)
        run("git", "push", "-f", remote, "gh-pages", cwd=out)


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
    publish_pages()
    print("Published.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
