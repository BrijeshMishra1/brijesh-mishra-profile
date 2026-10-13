#!/usr/bin/env python3
"""Find DOI links for publications that have none, and write src/data/links.json.

A candidate is accepted only if Crossref confirms it: the work's title must
closely match and its authors must include a "Mishra". Nothing is guessed.

Usage: python3 -I scripts/resolve_links.py
"""
import difflib, json, pathlib, re, time, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
LEGACY = ROOT / "src" / "data" / "legacy.json"
OUT = ROOT / "src" / "data" / "links.json"
UA = "profile-site-link-resolver/1.0 (mailto:brijesh.mishra0933@gmail.com)"
DOI_RE = re.compile(r"10\.\d{4,9}/[^\s,;]+")


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def get(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:  # nosec - fixed https host
        return json.load(r)


def check(item: dict, title: str):
    t = " ".join(item.get("title") or [""])
    ratio = difflib.SequenceMatcher(None, norm(t), norm(title)).ratio()
    has_mishra = any("mishra" in (a.get("family") or "").lower() for a in item.get("author", []))
    return ratio, has_mishra


def resolve(pub: dict):
    title = pub["title"]
    # 1) a DOI already written in the citation text
    for m in DOI_RE.findall(pub["venue"] + " " + pub["authors"]):
        doi = m.rstrip(".)")
        try:
            item = get("https://api.crossref.org/works/" + urllib.parse.quote(doi))["message"]
        except Exception:
            continue
        ratio, ok = check(item, title)
        if ratio >= 0.9 and ok:
            return doi, ratio
    # 2) bibliographic search
    q = urllib.parse.urlencode({"query.bibliographic": title, "query.author": "Mishra", "rows": 3})
    try:
        items = get("https://api.crossref.org/works?" + q)["message"]["items"]
    except Exception:
        return None, 0
    for item in items:
        ratio, ok = check(item, title)
        year = (item.get("issued", {}).get("date-parts") or [[None]])[0][0]
        if ratio >= 0.92 and ok and (year is None or abs(year - pub["year"]) <= 1):
            return item["DOI"], ratio
    return None, 0


def main():
    pubs = json.loads(LEGACY.read_text(encoding="utf-8"))["publications"]
    links = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    for p in pubs:
        if (p["link"] or "").startswith("https://") or p["title"] in links:
            continue
        doi, ratio = resolve(p)
        status = f"https://doi.org/{doi}" if doi else None
        print(("OK  " if doi else "--  ") + f"{p['year']} {p['title'][:70]}" + (f"  -> {doi} ({ratio:.2f})" if doi else ""))
        if status:
            links[p["title"]] = status
        time.sleep(0.4)
    OUT.write_text(json.dumps(links, ensure_ascii=False, indent=1, sort_keys=True), encoding="utf-8")
    print(f"\n{len(links)} resolved links written to {OUT.name}")


if __name__ == "__main__":
    main()
