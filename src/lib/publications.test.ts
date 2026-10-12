import { describe, expect, it } from "vitest";
import { legacy, parseLegacy } from "../data/legacy";
import { countByType, filterPublications, groupByYear, safeLink, splitAuthors, yearsOf } from "./publications";
import { patternPath, xFor } from "./spectrum";

describe("legacy data", () => {
  it("matches the counts on the publication list", () => {
    expect(countByType(legacy.publications)).toEqual({ sci: 35, scopus: 7, peer: 4, chapter: 10, conference: 12 });
    expect(legacy.patents).toHaveLength(10);
    expect(legacy.books).toHaveLength(5);
  });

  it("rejects a malformed file", () => {
    expect(() => parseLegacy({})).toThrow(/rerun scripts/);
  });
});

describe("filterPublications", () => {
  const all = legacy.publications;

  it("filters by type and year", () => {
    const r = filterPublications(all, { type: "sci", query: "", year: 2026 });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => p.type === "sci" && p.year === 2026)).toBe(true);
  });

  it("requires every search term, case-insensitively", () => {
    const r = filterPublications(all, { type: "all", query: "MIMO  MMWAVE", year: "all" });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => /mimo/i.test(p.title + p.venue + p.authors) && /mmwave/i.test(p.title + p.venue + p.authors))).toBe(true);
  });

  it("returns nothing for an unmatched query", () => {
    expect(filterPublications(all, { type: "all", query: "zzzzqqq", year: "all" })).toEqual([]);
  });
});

describe("helpers", () => {
  it("groups newest year first", () => {
    const years = groupByYear(legacy.publications).map((g) => g.year);
    expect(years).toEqual([...years].sort((a, b) => b - a));
    expect(years).toEqual(yearsOf(legacy.publications));
  });

  it("splits author text around the owner's name", () => {
    expect(splitAuthors("A. Kumar, Brijesh Mishra and P. Pattanayak")).toEqual([
      { text: "A. Kumar, ", own: false },
      { text: "Brijesh Mishra", own: true },
      { text: " and P. Pattanayak", own: false },
    ]);
  });

  it("only allows https links", () => {
    expect(safeLink("https://doi.org/10.1/x")).toBe("https://doi.org/10.1/x");
    expect(safeLink("javascript:alert(1)")).toBeNull();
    expect(safeLink("http://example.com")).toBeNull();
    expect(safeLink(null)).toBeNull();
  });

  it("maps frequency to a log position", () => {
    expect(xFor(0.5, 1000)).toBe(0);
    expect(xFor(10000, 1000)).toBe(1000);
    expect(xFor(100, 1000)).toBeGreaterThan(xFor(10, 1000));
    expect(patternPath()).toMatch(/^M.*Z$/);
  });
});
