import type { Publication, PublicationType } from "../data/legacy";

export type TypeFilter = PublicationType | "all";

export interface Filters {
  type: TypeFilter;
  query: string;
  year: number | "all";
}

export const TYPE_LABEL: Record<PublicationType, string> = {
  sci: "SCI journals",
  scopus: "Scopus / ESCI journals",
  peer: "Peer-reviewed journals",
  chapter: "Book chapters",
  conference: "Conferences",
};

export const TYPE_ORDER: readonly PublicationType[] = ["sci", "scopus", "peer", "chapter", "conference"];

const normalise = (s: string) => s.toLowerCase().normalize("NFKD").replace(/\s+/g, " ").trim();

/** Case-insensitive match on every whitespace-separated term, across title, authors and venue. */
export function filterPublications(items: readonly Publication[], f: Filters): Publication[] {
  const terms = normalise(f.query).split(" ").filter(Boolean);
  return items.filter((p) => {
    if (f.type !== "all" && p.type !== f.type) return false;
    if (f.year !== "all" && p.year !== f.year) return false;
    if (terms.length === 0) return true;
    const haystack = normalise(`${p.title} ${p.authors} ${p.venue}`);
    return terms.every((t) => haystack.includes(t));
  });
}

export function countByType(items: readonly Publication[]): Record<PublicationType, number> {
  const out = { sci: 0, scopus: 0, peer: 0, chapter: 0, conference: 0 };
  for (const p of items) out[p.type] += 1;
  return out;
}

export function yearsOf(items: readonly Publication[]): number[] {
  return [...new Set(items.map((p) => p.year))].sort((a, b) => b - a);
}

/** Newest first; within a year, journals before chapters before conferences. */
export function groupByYear(items: readonly Publication[]): { year: number; items: Publication[] }[] {
  const rank = (p: Publication) => TYPE_ORDER.indexOf(p.type);
  const byYear = new Map<number, Publication[]>();
  for (const p of items) byYear.set(p.year, [...(byYear.get(p.year) ?? []), p]);
  return [...byYear.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, list]) => ({ year, items: [...list].sort((a, b) => rank(a) - rank(b)) }));
}

/** Splits text so the owner's name can be emphasised without using innerHTML. */
export function splitAuthors(authors: string, owner = "Brijesh Mishra"): { text: string; own: boolean }[] {
  if (!authors) return [];
  const parts = authors.split(owner);
  const out: { text: string; own: boolean }[] = [];
  parts.forEach((part, i) => {
    if (part) out.push({ text: part, own: false });
    if (i < parts.length - 1) out.push({ text: owner, own: true });
  });
  return out;
}

/** Links must be https to be rendered as anchors. */
export function safeLink(url: string | null): string | null {
  return url && /^https:\/\//i.test(url) ? url : null;
}
