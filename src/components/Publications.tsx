import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { legacy } from "../data/legacy";
import {
  TYPE_LABEL, TYPE_ORDER, countByType, filterPublications, groupByYear, safeLink, splitAuthors, yearsOf,
  type TypeFilter,
} from "../lib/publications";

const PAGE = 12;
const all = legacy.publications;
const counts = countByType(all);
const years = yearsOf(all);

interface Props {
  query: string;
  onQuery: (q: string) => void;
}

export function Publications({ query, onQuery }: Props) {
  const [type, setType] = useState<TypeFilter>("all");
  const [year, setYear] = useState<number | "all">("all");
  const [shown, setShown] = useState(PAGE);

  // A printed CV should list every paper, not just the first page of results.
  useEffect(() => {
    const expand = () => setShown(Number.MAX_SAFE_INTEGER);
    window.addEventListener("beforeprint", expand);
    return () => window.removeEventListener("beforeprint", expand);
  }, []);

  // Typing stays instant; the list is filtered from a deferred copy of the query.
  const deferredQuery = useDeferredValue(query);
  const result = useMemo(
    () => filterPublications(all, { type, query: deferredQuery, year }),
    [type, deferredQuery, year],
  );
  const visible = result.slice(0, shown);
  const groups = useMemo(() => groupByYear(visible), [visible]);

  const reset = () => {
    setType("all");
    setYear("all");
    onQuery("");
    setShown(PAGE);
  };

  return (
    <div className="pubs">
      <div className="pubs__tools">
        <div className="chips" role="group" aria-label="Publication type">
          {(["all", ...TYPE_ORDER] as TypeFilter[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              className={`chip ${type === t ? "chip--on" : ""}`}
              onClick={() => { setType(t); setShown(PAGE); }}
            >
              {t === "all" ? "All" : TYPE_LABEL[t]}
              <span className="chip__n">{t === "all" ? all.length : counts[t]}</span>
            </button>
          ))}
        </div>
        <div className="pubs__row">
          <label className="field">
            <span className="field__label">Search</span>
            <input
              type="search"
              value={query}
              placeholder="Title, author or venue"
              onChange={(e) => { onQuery(e.target.value); setShown(PAGE); }}
            />
          </label>
          <label className="field field--narrow">
            <span className="field__label">Year</span>
            <select
              value={year}
              onChange={(e) => { setYear(e.target.value === "all" ? "all" : Number(e.target.value)); setShown(PAGE); }}
            >
              <option value="all">All years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
        </div>
        <p className="pubs__count" aria-live="polite">
          {result.length === 0 ? "No papers match." : `${result.length} of ${all.length} papers`}
          {(type !== "all" || year !== "all" || query) && (
            <button type="button" className="linkish" onClick={reset}>Clear filters</button>
          )}
        </p>
      </div>

      {groups.map((g) => (
        <div className="pubs__year" key={g.year}>
          <h3>{g.year}</h3>
          <ol>
            {g.items.map((p) => {
              const href = safeLink(p.link);
              return (
                <li key={`${p.type}-${p.year}-${p.title}`} className="pub">
                  <p className="pub__title">{p.title}</p>
                  <p className="pub__authors">
                    {splitAuthors(p.authors).map((s, k) =>
                      s.own ? <strong key={k}>{s.text}</strong> : <span key={k}>{s.text}</span>,
                    )}
                  </p>
                  <p className="pub__venue">
                    <span className="tag">{TYPE_LABEL[p.type]}</span>
                    <span className="pub__venue-text">{p.venue}</span>
                    {p.impact !== null && <span className="tag tag--if">IF {p.impact}</span>}
                    {p.corresponding && <span className="tag">Corresponding author</span>}
                    {href && (
                      <> <a className="pub__link" href={href} target="_blank" rel="noreferrer">Link</a></>
                    )}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      ))}

      {shown < result.length && (
        <button type="button" className="btn btn--more" onClick={() => setShown((n) => n + PAGE)}>
          Show {Math.min(PAGE, result.length - shown)} more
        </button>
      )}
    </div>
  );
}
