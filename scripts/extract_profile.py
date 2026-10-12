#!/usr/bin/env python3
"""Extract list-style data from the legacy profile page into src/data/legacy.json.

Usage: python3 -I scripts/extract_profile.py <path to legacy index.html>

The legacy page is the source of truth for publications, books, patents,
reviewer list, memberships, etc. This script only reads it; it never writes
outside src/data/legacy.json.
"""
import json, re, sys, html, pathlib

SRC = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8").replace("\r\n", "\n")
OUT = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "legacy.json"


def clean(fragment: str) -> str:
    text = re.sub(r"<br\s*/?>", " ", fragment)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text).replace(" ", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text.replace("’", "'") if False else text


def section(heading: str) -> str:
    """Return the raw HTML of the first <ol>/<ul> after the heading."""
    h = SRC.index("<a>" + heading) if ("<a>" + heading) in SRC else SRC.index("<a> " + heading)
    m = re.compile(r"<(ol|ul)>").search(SRC, h)
    assert m, heading
    end = SRC.index("</%s>" % m.group(1), m.end())
    return SRC[m.end():end]


def simple_list(heading: str):
    body = section(heading)
    items = re.split(r"<li[^>]*>", body)[1:]
    return [t for t in (clean(i) for i in items) if t]


TOKEN = re.compile(r"<strong>\s*(\d{4})\s*</strong>|<li[^>]*>", re.S)


def entries(heading: str):
    body = section(heading)
    year, out = None, []
    marks = list(TOKEN.finditer(body))
    for i, m in enumerate(marks):
        if m.group(1):
            year = int(m.group(1))
            continue
        end = marks[i + 1].start() if i + 1 < len(marks) else len(body)
        raw = body[m.end():end]
        links = re.findall(r'href\s*=\s*"\s*([^"]+?)\s*"', raw)
        out.append({"year": year, "raw": raw, "links": links})
    return out


def split_citation(text: str):
    q = re.search(r"[“\"](.+?)[”\"]", text)
    if not q:
        return "", text, ""
    return text[: q.start()].strip(" ,"), q.group(1).strip(" ,"), text[q.end():].strip(" ,")


def clean_venue(venue: str) -> str:
    """Impact factor and corresponding-author marks are shown as tags, so drop them from the venue text."""
    v = re.sub(r"\(\s*Impact factor:?[^)]*\)", "", venue, flags=re.I)
    v = re.sub(r"\*?\s*Corresponding author\.?", "", v, flags=re.I)
    v = re.sub(r"\s+", " ", v)
    v = re.sub(r"\s+([,.;])", r"\1", v)
    v = re.sub(r"([,.;])(\s*[,.;])+", r"\1", v)
    return v.strip(" ,;")


def publication(kind: str, e):
    text = clean(e["raw"])
    text = re.sub(r"\(link\)", "", text).strip()
    authors, title, venue = split_citation(text)
    impact = re.search(r"Impact factor:?\s*([\d.]+)", text, re.I)
    link = next((l for l in e["links"] if l.startswith("http")), None)
    return {
        "type": kind, "year": e["year"], "authors": authors, "title": title or text,
        "venue": clean_venue(venue), "impact": float(impact.group(1)) if impact else None,
        "corresponding": "*" in text, "link": link,
    }


pubs = []
for kind, heading in [
    ("sci", "Journal (SCI Indexed)"),
    ("scopus", "Journal: (ESCI/SCOPUS Indexed)"),
    ("peer", "Peer reviewed Journals"),
    ("chapter", "Book Chapter: (SCOPUS Indexed)"),
    ("conference", "Conference Proceedings: Full Papers"),
]:
    pubs += [publication(kind, e) for e in entries(heading)]

books = []
for e in entries("Edited International Books"):
    text = clean(e["raw"]).replace("(link)", "").strip()
    books.append({"text": text, "link": next((l for l in e["links"] if l.startswith("http")), None)})

patents = [{"text": clean(e["raw"])} for e in entries("Patents")]

data = {
    "publications": pubs,
    "books": books,
    "patents": patents,
    "interests": simple_list("Research area of interests:"),
    "subjects": simple_list("Subjects Taught so far:"),
    "activities": simple_list("Other Assignments/Activitiest:"),
    "memberships": simple_list("Professional body memberships"),
    "reviewer": simple_list("Worked as Reviewer in the following Journals/Conferences"),
    "tools": simple_list("Software skills/Computer knowledge"),
}
OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
print({k: len(v) for k, v in data.items()})
