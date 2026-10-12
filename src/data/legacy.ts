import raw from "./legacy.json";
import doiLinks from "./links.json";

export type PublicationType = "sci" | "scopus" | "peer" | "chapter" | "conference";

export interface Publication {
  type: PublicationType;
  year: number;
  authors: string;
  title: string;
  venue: string;
  impact: number | null;
  corresponding: boolean;
  link: string | null;
}

export interface Book {
  text: string;
  link: string | null;
}

export interface Legacy {
  publications: Publication[];
  books: Book[];
  patents: { text: string }[];
  interests: string[];
  subjects: string[];
  activities: string[];
  memberships: string[];
  reviewer: string[];
  tools: string[];
}

const TYPES: ReadonlySet<string> = new Set(["sci", "scopus", "peer", "chapter", "conference"]);

/** Fail fast if the generated file drifts from the shape the UI relies on. */
export function parseLegacy(input: unknown): Legacy {
  const d = input as Legacy;
  const lists: (keyof Legacy)[] = [
    "publications", "books", "patents", "interests", "subjects",
    "activities", "memberships", "reviewer", "tools",
  ];
  for (const key of lists) {
    if (!Array.isArray(d?.[key]) || d[key].length === 0) {
      throw new Error(`legacy.json: "${key}" is missing or empty; rerun scripts/extract_profile.py`);
    }
  }
  for (const p of d.publications) {
    if (!TYPES.has(p.type) || !Number.isInteger(p.year) || !p.title) {
      throw new Error(`legacy.json: malformed publication "${p.title ?? "?"}"`);
    }
  }
  return d;
}

/** DOI links found by scripts/resolve_links.py (Crossref-verified), keyed by exact title. */
const LINKS: Readonly<Record<string, string>> = doiLinks;

export function withLinks(data: Legacy): Legacy {
  return {
    ...data,
    publications: data.publications.map((p) => {
      const own = p.link && p.link.startsWith("https://") ? p.link : null;
      return { ...p, link: own ?? LINKS[p.title] ?? null };
    }),
  };
}

export const legacy: Legacy = withLinks(parseLegacy(raw));
