#!/usr/bin/env python3
"""Add newly listed papers from the author's own Google Scholar and ORCID records.

Only two sources are used, both the author's own official records:
  * Google Scholar profile (papers sorted newest first; only the latest page is read)
  * ORCID public record (works list; DOI links, and the fallback when Scholar blocks us)

Cost is kept low: one small request for the newest papers, an exact-title lookup
against a set of what the site already has, and fuzzy comparison only for the few
titles that are not an exact match. If the metrics and the newest papers are
unchanged the script ends there.

Usage: python3 scripts/sync_scholar.py [--dry-run] [--full]
  --full  walk the whole profile once (to bring the site level with Scholar)
Exit codes: 0 ok (changed or not), 2 neither source could be read.
Writes `changed=true|false` to $GITHUB_OUTPUT when running in Actions.
"""
import difflib, html, json, os, pathlib, re, sys, time, urllib.parse, urllib.request
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
LEGACY = ROOT / "src" / "data" / "legacy.json"
SYNC = ROOT / "src" / "data" / "scholar-sync.json"
SCHOLAR_ID = "wyrOw28AAAAJ"
ORCID = "0000-0002-2535-7159"
LATEST = 20  # newest papers examined per run
SIMILAR = 0.78  # titles this alike are the same paper, spelled differently
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
CONF = re.compile(r"conference|proceedings|symposium|workshop|\bconf\b", re.I)
CHAPTER = re.compile(r"\bbook\b|chapter|lecture notes|handbook", re.I)
ORCID_KIND = {"conference-paper": "conference", "book-chapter": "chapter", "book": "chapter"}


class Unreachable(Exception):
    pass


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def http(url: str, accept: str | None = None) -> str:
    headers = {"User-Agent": UA, "Accept-Language": "en"}
    if accept:
        headers["Accept"] = accept
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30) as r:  # nosec - fixed https hosts
            return r.read().decode("utf-8", "replace")
    except Exception as e:
        raise Unreachable(str(e)) from e


def clean(s: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s))).strip()


def kind(venue: str) -> str:
    if CONF.search(venue):
        return "conference"
    return "chapter" if CHAPTER.search(venue) else "sci"


def scholar_page(start: int, size: int, page: str | None = None):
    q = urllib.parse.urlencode({"user": SCHOLAR_ID, "hl": "en", "sortby": "pubdate",
                                "cstart": start, "pagesize": size})
    page = page or http("https://scholar.google.com/citations?" + q)
    rows = []
    for row in re.findall(r'<tr class="gsc_a_tr">(.*?)</tr>', page, re.S):
        title = re.search(r'<a href="([^"]*)" class="gsc_a_at"[^>]*>(.*?)</a>', row, re.S)
        grays = re.findall(r'<div class="gs_gray">(.*?)</div>', row, re.S)
        year = re.search(r'class="gsc_a_h gsc_a_hc gs_ibl">(\d{4})<', row)
        if title and year:
            venue, name = (clean(grays[1]) if len(grays) > 1 else ""), clean(title.group(2))
            cite = re.search(r"citation_for_view=([^&\"]+)", html.unescape(title.group(1)))
            link = (f"https://scholar.google.com/citations?view_op=view_citation&hl=en&user={SCHOLAR_ID}"
                    f"&citation_for_view={cite.group(1)}") if cite else None
            rows.append({"title": name, "authors": clean(grays[0]) if grays else "", "venue": venue,
                         "year": int(year.group(1)), "type": kind(venue + " " + name), "link": link})
    return rows, page


def scholar_latest(full: bool = False):
    """Papers (newest first) and the profile metrics. `full` walks every page of the profile."""
    size = 100 if full else LATEST
    rows, page = scholar_page(0, size)
    stats = [int(n) for n in re.findall(r'class="gsc_rsb_std">(\d+)<', page)]
    if not rows or len(stats) < 6:
        raise Unreachable("no profile data in the response (captcha or block page)")
    while full and len(rows) % size == 0:
        more, _ = scholar_page(len(rows), size)
        if not more:
            break
        rows += more
        time.sleep(2)
    return rows, {"citations": stats[0], "hIndex": stats[2], "i10Index": stats[4]}


def orcid_works():
    """The ORCID record's works, newest update first, as the same row shape."""
    data = json.loads(http(f"https://pub.orcid.org/v3.0/{ORCID}/works", "application/json"))
    rows = []
    for g in data.get("group", []):
        w = g["work-summary"][0]
        title = ((w.get("title") or {}).get("title") or {}).get("value")
        year = (((w.get("publication-date") or {}).get("year")) or {}).get("value")
        if not title or not year:
            continue
        doi = next((e["external-id-value"] for e in (g.get("external-ids") or {}).get("external-id", [])
                    if e.get("external-id-type") == "doi"), None)
        venue = ((w.get("journal-title") or {}).get("value")) or ""
        rows.append({"title": title, "authors": "Brijesh Mishra", "venue": f"{venue}, {year}." if venue else str(year),
                     "year": int(year), "type": ORCID_KIND.get(w.get("type"), "sci"),
                     "link": f"https://doi.org/{doi}" if doi else None,
                     "modified": w.get("last-modified-date", {}).get("value", 0)})
    rows.sort(key=lambda r: r["modified"], reverse=True)
    return rows


def is_new(title: str, exact: set[str], known: list[str]) -> bool:
    """False for an exact match or a near-identical title of a known paper.

    Short titles are compared exactly only: a fuzzy match on a few words is a coincidence.
    """
    n = norm(title)
    if n in exact:
        return False
    if len(n) < 20:
        return True
    return not any(n in k or difflib.SequenceMatcher(None, n, k).ratio() >= SIMILAR for k in known)


def main() -> int:
    dry = "--dry-run" in sys.argv
    full = "--full" in sys.argv
    sync = json.loads(SYNC.read_text(encoding="utf-8"))
    legacy = json.loads(LEGACY.read_text(encoding="utf-8"))
    texts = [p["title"] for p in legacy["publications"] + sync["publications"]]
    texts += [b["text"] for b in legacy["books"]] + [x["text"] for x in legacy["patents"]]
    known = [norm(t) for t in texts]
    exact = set(known)

    metrics, source = None, "Google Scholar"
    try:
        rows, metrics = scholar_latest(full)
    except Unreachable as e:
        print(f"Google Scholar not reachable ({e}); reading the ORCID record instead.", file=sys.stderr)
        source = "ORCID"
        try:
            rows = orcid_works() if full else orcid_works()[:LATEST]
        except Unreachable as e2:
            print(f"ORCID not reachable either ({e2}). Nothing changed.", file=sys.stderr)
            set_output(False)
            return 2

    new = [r for r in rows if is_new(r["title"], exact, known)]
    metrics_changed = metrics is not None and metrics != sync["metrics"]
    if not new and not metrics_changed:
        print(f"No changes ({source}: latest {len(rows)} papers already on the site).")
        set_output(False)
        return 0

    if new and source == "Google Scholar":  # official DOI links come from the ORCID record
        try:
            dois = {norm(w["title"]): w["link"] for w in orcid_works() if w["link"]}
        except Unreachable:
            dois = {}
        for r in new:
            r["link"] = dois.get(norm(r["title"])) or r["link"]
    added = [{"type": r["type"], "year": r["year"], "authors": r["authors"], "title": r["title"],
              "venue": r["venue"], "impact": None, "corresponding": False, "link": r["link"]} for r in new]
    for p in added:
        print(f"NEW  {p['year']} {p['title'][:80]}  [{p['type']}] {p['link'] or 'no link'}")
    if metrics_changed:
        print(f"Metrics: {sync['metrics']} -> {metrics}")

    if not dry:
        sync["publications"] = added + sync["publications"]
        if metrics:
            sync["metrics"] = metrics
        sync["syncedOn"] = date.today().isoformat()
        SYNC.write_text(json.dumps(sync, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"Wrote {SYNC.name}")
    set_output(not dry)
    return 0


def set_output(changed: bool) -> None:
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.write(f"changed={'true' if changed else 'false'}\n")


if __name__ == "__main__":
    sys.exit(main())
