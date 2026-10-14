#!/usr/bin/env python3
"""Check Google Scholar for new papers and metrics; update src/data/scholar-sync.json.

Papers already in legacy.json or scholar-sync.json (matched on normalised,
fuzzy title) are skipped, as are front-matter records such as "Preface". A new paper is enriched from Crossref when a verified
match exists (full author list, journal, DOI link); otherwise the Scholar
record is used as is. If Scholar blocks the request (it often does for cloud
IPs) the same check runs against OpenAlex via the ORCID iD, so the script works
from any network, but then only lists candidates for review (a name match is not
proof of authorship) and leaves the site data alone. If both fail, nothing is
changed and the script exits 2.

Usage: python3 scripts/sync_scholar.py [--dry-run]
Writes `changed=true|false` to $GITHUB_OUTPUT when running in Actions.
"""
import difflib, html, json, os, pathlib, re, sys, time, urllib.parse, urllib.request
from datetime import date

import resolve_links as rl

ROOT = pathlib.Path(__file__).resolve().parent.parent
LEGACY = ROOT / "src" / "data" / "legacy.json"
SYNC = ROOT / "src" / "data" / "scholar-sync.json"
SCHOLAR_ID = "wyrOw28AAAAJ"
ORCID = "0000-0002-2535-7159"
PAGE = 100
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
CONF = re.compile(r"conference|proceedings|symposium|workshop|\bconf\b|\bicc\b|\bieee .* (?:ic|sym)", re.I)
CHAPTER = re.compile(r"\bbook\b|chapter|lecture notes|springer nature singapore|handbook", re.I)


SIMILAR = 0.78  # titles this alike are the same paper, spelled differently
JUNK = re.compile(r"^(committees?|preface|sn paper id)\b|\bproceedings of\b|\bselect proceedings\b", re.I)


class Blocked(Exception):
    pass


def fetch_page(start: int) -> str:
    q = urllib.parse.urlencode({"user": SCHOLAR_ID, "hl": "en", "cstart": start, "pagesize": PAGE})
    req = urllib.request.Request("https://scholar.google.com/citations?" + q,
                                 headers={"User-Agent": UA, "Accept-Language": "en"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:  # nosec - fixed https host
            return r.read().decode("utf-8", "replace")
    except Exception as e:
        raise Blocked(f"request failed: {e}") from e


def clean(s: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s))).strip()


def parse(page: str):
    rows = []
    for row in re.findall(r'<tr class="gsc_a_tr">(.*?)</tr>', page, re.S):
        title = re.search(r'class="gsc_a_at"[^>]*>(.*?)</a>', row, re.S)
        grays = re.findall(r'<div class="gs_gray">(.*?)</div>', row, re.S)
        year = re.search(r'class="gsc_a_h gsc_a_hc gs_ibl">(\d{4})<', row)
        if title and year:
            rows.append({"title": clean(title.group(1)),
                         "authors": clean(grays[0]) if grays else "",
                         "venue": clean(grays[1]) if len(grays) > 1 else "",
                         "year": int(year.group(1))})
    stats = [int(n) for n in re.findall(r'class="gsc_rsb_std">(\d+)<', page)]
    metrics = None
    if len(stats) >= 6:
        metrics = {"citations": stats[0], "hIndex": stats[2], "i10Index": stats[4]}
    return rows, metrics


def scrape():
    rows, metrics, start = [], None, 0
    while True:
        page_rows, m = parse(fetch_page(start))
        if start == 0:
            if not page_rows or not m:
                raise Blocked("no profile data in the response (captcha or block page)")
            metrics = m
        rows += page_rows
        if len(page_rows) < PAGE:
            return rows, metrics
        start += PAGE
        time.sleep(2)


def is_new(title: str, known: list[str]) -> bool:
    """False for front matter and for titles that match a known paper closely."""
    n = rl.norm(title)
    if JUNK.search(title) or len(n) < 20:
        return False
    return not any(n == k or n in k or difflib.SequenceMatcher(None, n, k).ratio() >= SIMILAR for k in known)


def scrape_openalex():
    """Fallback when Scholar blocks us: works OpenAlex ties to the ORCID iD, same row shape.

    OpenAlex sometimes attributes other people's papers to an ORCID, so a work is
    kept only if one of its authors is named "B... Mishra" and the year is plausible.
    """
    q = urllib.parse.urlencode({
        "filter": f"author.orcid:https://orcid.org/{ORCID}", "per-page": 200,
        "select": "title,publication_year,authorships", "mailto": "brijesh.mishra0933@gmail.com"})
    works = rl.get("https://api.openalex.org/works?" + q)["results"]
    rows = []
    for w in works:
        names = [a["author"]["display_name"] for a in w.get("authorships", [])]
        mine = any(re.match(r"^b\w*\.?\s.*mishra$", n.strip(), re.I) for n in names)
        if mine and w.get("title") and (w.get("publication_year") or 0) >= 2010:
            rows.append({"title": w["title"], "authors": ", ".join(names), "venue": "",
                         "year": w["publication_year"]})
    return rows, None


def kind(crossref_type: str | None, venue: str) -> str:
    if crossref_type == "proceedings-article" or CONF.search(venue):
        return "conference"
    if crossref_type in ("book-chapter", "book") or CHAPTER.search(venue):
        return "chapter"
    return "sci"


def enrich(row: dict) -> dict:
    """Build a publication record, preferring Crossref's verified data."""
    pub = {"type": kind(None, row["venue"]), "year": row["year"], "authors": row["authors"],
           "title": row["title"], "venue": row["venue"], "impact": None,
           "corresponding": False, "link": None}
    q = urllib.parse.urlencode({"query.bibliographic": row["title"], "query.author": "Mishra", "rows": 3})
    try:
        items = rl.get("https://api.crossref.org/works?" + q)["message"]["items"]
    except Exception:
        return pub
    for item in items:
        ratio, ok = rl.check(item, row["title"])
        year = (item.get("issued", {}).get("date-parts") or [[None]])[0][0]
        if ratio >= 0.92 and ok and (year is None or abs(year - row["year"]) <= 1):
            names = [" ".join(filter(None, [a.get("given"), a.get("family")])) for a in item.get("author", [])]
            if names:
                pub["authors"] = ", ".join(names)
            container = " ".join(item.get("container-title") or [])
            if container:
                pub["venue"] = f"{container}, {item.get('publisher', '')}, {row['year']}.".replace(", ,", ",")
            pub["type"] = kind(item.get("type"), pub["venue"])
            pub["link"] = "https://doi.org/" + item["DOI"]
            break
    return pub


def main() -> int:
    dry = "--dry-run" in sys.argv
    sync = json.loads(SYNC.read_text(encoding="utf-8"))
    legacy = json.loads(LEGACY.read_text(encoding="utf-8"))
    texts = [p["title"] for p in legacy["publications"] + sync["publications"]]
    texts += [b["text"] for b in legacy["books"]] + [x["text"] for x in legacy["patents"]]
    known = [rl.norm(t) for t in texts]

    try:
        if os.environ.get("SYNC_SOURCE") == "openalex":
            raise Blocked("SYNC_SOURCE=openalex")
        rows, metrics = scrape()
    except Blocked as e:
        print(f"Scholar not reachable ({e}); using OpenAlex via ORCID. Metrics unchanged.", file=sys.stderr)
        try:
            rows, metrics = scrape_openalex()
            dry = True  # name matches are not proof of authorship (other Brijesh Mishras exist): review only
            print("Candidates are listed for review only; add a paper yourself if it is yours.", file=sys.stderr)
        except Exception as e2:
            print(f"OpenAlex failed too: {e2}. Nothing changed.", file=sys.stderr)
            set_output(False)
            return 2

    new = [r for r in rows if is_new(r["title"], known)]
    added = []
    for r in new:
        pub = enrich(r)
        print(f"NEW  {pub['year']} {pub['title'][:80]}  [{pub['type']}] {pub['link'] or 'no DOI'}")
        added.append(pub)
        time.sleep(0.4)

    changed = bool(added) or (metrics is not None and metrics != sync["metrics"])
    if metrics and metrics != sync["metrics"]:
        print(f"Metrics: {sync['metrics']} -> {metrics}")
    if not changed:
        print(f"No changes. Scholar lists {len(rows)} papers, all already on the site.")
    elif not dry:
        sync["publications"] = added + sync["publications"]
        if metrics:
            sync["metrics"] = metrics
        sync["syncedOn"] = date.today().isoformat()
        SYNC.write_text(json.dumps(sync, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"Wrote {SYNC.name}")
    set_output(changed and not dry)
    return 0


def set_output(changed: bool) -> None:
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.write(f"changed={'true' if changed else 'false'}\n")


if __name__ == "__main__":
    sys.exit(main())
