import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Hero } from "./components/Hero";
import { Publications } from "./components/Publications";
import { ActiveTab, Section } from "./components/Section";
import { Spectrum } from "./components/Spectrum";
import { legacy } from "./data/legacy";
import {
  bio, bands, conferences, editorial, education, experience, identity, links, projects, type SectionId,
} from "./data/profile";
import { safeLink } from "./lib/publications";

type Theme = "light" | "dark";
const THEME_KEY = "bm-theme";

const NAV: { id: SectionId; label: string }[] = [
  { id: "about", label: "About" },
  { id: "research", label: "Research" },
  { id: "experience", label: "Career" },
  { id: "publications", label: "Papers" },
  { id: "patents", label: "Patents & books" },
  { id: "projects", label: "Projects" },
  { id: "service", label: "Service" },
  { id: "toolkit", label: "Toolkit" },
  { id: "contact", label: "Contact" },
];

function readTheme(): Theme | null {
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null; // storage can be blocked (private windows); the page still works
  }
}

function useTheme(): [Theme | null, () => void] {
  const [theme, setTheme] = useState<Theme | null>(readTheme);
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }, [theme]);
  const toggle = useCallback(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const next: Theme = (theme ?? system) === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* preference just won't persist */
    }
  }, [theme]);
  return [theme, toggle];
}

const isSectionId = (v: string): v is SectionId => NAV.some((n) => n.id === v);

/** The active tab lives in the URL hash so every tab is linkable and Back works. */
function useTab(): [SectionId, (id: SectionId) => void] {
  const read = (): SectionId => {
    const h = window.location.hash.slice(1);
    return isSectionId(h) ? h : "about";
  };
  const [tab, setTab] = useState<SectionId>(read);
  useEffect(() => {
    const onHash = () => setTab(read());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const select = useCallback((id: SectionId) => {
    setTab(id);
    if (window.location.hash.slice(1) !== id) window.history.pushState(null, "", `#${id}`);
  }, []);
  return [tab, select];
}

export function App() {
  const [query, setQuery] = useState("");
  const [, toggleTheme] = useTheme();
  const [tab, selectTab] = useTab();
  const tabsRef = useRef<HTMLDivElement>(null);

  const pickBand = useCallback(
    (q: string) => {
      setQuery(q);
      selectTab("publications");
      tabsRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    },
    [selectTab],
  );

  // Roving tabindex: arrow keys move between tabs, Home/End jump to the ends.
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = NAV.length - 1;
    const next =
      e.key === "ArrowRight" ? (index + 1) % NAV.length :
      e.key === "ArrowLeft" ? (index - 1 + NAV.length) % NAV.length :
      e.key === "Home" ? 0 :
      e.key === "End" ? last : -1;
    if (next < 0) return;
    e.preventDefault();
    selectTab(NAV[next].id);
    document.getElementById(`tab-${NAV[next].id}`)?.focus();
  };

  return (
    <>
      <a className="skip" href="#content">Skip to content</a>
      <Hero onToggleTheme={toggleTheme} />

      <div className="tabs" ref={tabsRef}>
        <div className="tabs__bar" role="tablist" aria-label="Profile sections">
          {NAV.map((n, i) => (
            <button
              key={n.id}
              id={`tab-${n.id}`}
              type="button"
              role="tab"
              aria-selected={tab === n.id}
              aria-controls={`panel-${n.id}`}
              tabIndex={tab === n.id ? 0 : -1}
              className="tabs__tab"
              onClick={() => selectTab(n.id)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      <main id="content">
        <ActiveTab.Provider value={tab}>
        <Section id="about" title="About" kicker="Profile">
          <div className="prose">
            <p className="prose__lead">{bio[0]}</p>
            <div className="prose__cols">
              {bio.slice(1).map((p) => <p key={p}>{p}</p>)}
            </div>
          </div>
        </Section>

        <Section id="research" title="Research" kicker="What the work is about">
          <Spectrum onPick={pickBand} />
          <div className="split">
            <div>
              <h3 className="h3">Interests</h3>
              <ul className="chips chips--static">
                {legacy.interests.map((i) => <li key={i} className="chip chip--plain">{i}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="h3">Frequency bands in the papers</h3>
              <ul className="plain">
                {bands.map((b) => (
                  <li key={b.id}>
                    <button type="button" className="linkish" onClick={() => pickBand(b.query)}>{b.label}</button>
                  </li>
                ))}
              </ul>
              <h3 className="h3">Courses taught</h3>
              <ul className="plain">
                {legacy.subjects.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="experience" title="Career and education" kicker="Positions held">
          <div className="split">
            <ol className="timeline" aria-label="Positions">
              {experience.map((r) => (
                <li key={r.period}>
                  <p className="timeline__when">{r.period}</p>
                  <p className="timeline__what">{r.title}</p>
                  <p className="timeline__where">{r.org}</p>
                  {r.detail && <p className="timeline__note">{r.detail}</p>}
                </li>
              ))}
            </ol>
            <ol className="timeline timeline--edu" aria-label="Education">
              {education.map((d) => (
                <li key={d.year}>
                  <p className="timeline__when">{d.year}</p>
                  <p className="timeline__what">{d.title}, {d.field}</p>
                  <p className="timeline__where">{d.org}</p>
                  {d.detail && <p className="timeline__note">{d.detail}</p>}
                </li>
              ))}
            </ol>
          </div>
        </Section>

        <Section id="publications" title="Publications" kicker={`${legacy.publications.length} papers`}>
          <Publications query={query} onQuery={setQuery} />
        </Section>

        <Section id="patents" title="Patents and edited books" kicker="Beyond journals">
          <div className="split">
            <div>
              <h3 className="h3">Patents ({legacy.patents.length})</h3>
              <ol className="cites">
                {legacy.patents.map((p) => <li key={p.text}>{p.text}</li>)}
              </ol>
            </div>
            <div>
              <h3 className="h3">Edited international books ({legacy.books.length})</h3>
              <ol className="cites">
                {legacy.books.map((b) => {
                  const href = safeLink(b.link);
                  return (
                    <li key={b.text}>
                      {b.text}
                      {href && <> <a href={href} target="_blank" rel="noreferrer">Publisher page</a></>}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </Section>

        <Section id="projects" title="Sponsored projects" kicker="Funded research">
          <ul className="cards">
            {projects.map((p) => (
              <li key={p.title} className="card">
                <span className={`status status--${p.status.toLowerCase()}`}>{p.status}</span>
                <p className="card__title">{p.title}</p>
                <dl className="card__meta">
                  <div><dt>{p.amountLabel}</dt><dd>{p.amount}</dd></div>
                  <div><dt>Role</dt><dd>{p.role}</dd></div>
                  <div><dt>Agency</dt><dd>{p.agency}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="service" title="Service to the community" kicker="Editorial, conferences, reviewing">
          <div className="split split--3">
            <div>
              <h3 className="h3">Editorial roles</h3>
              <ul className="plain">{editorial.map((e) => <li key={e}>{e}</li>)}</ul>
              <h3 className="h3">Memberships</h3>
              <ul className="plain">{legacy.memberships.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
            <div>
              <h3 className="h3">Conferences organised</h3>
              <ul className="plain plain--rows">
                {conferences.map((c) => (
                  <li key={c.name}>
                    <strong>{c.name}</strong>
                    <span>{c.role}, {c.publisher}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="h3">Reviewer for</h3>
              <ul className="plain plain--tight">
                {legacy.reviewer.slice(0, 8).map((r) => <li key={r}>{r}</li>)}
              </ul>
              <details className="more">
                <summary>All {legacy.reviewer.length} entries</summary>
                <ul className="plain plain--tight">
                  {legacy.reviewer.slice(8).map((r) => <li key={r}>{r}</li>)}
                </ul>
              </details>
            </div>
          </div>
          <details className="more more--wide">
            <summary>Workshops, FDPs, awards and conference papers ({legacy.activities.length})</summary>
            <ul className="plain plain--tight">
              {legacy.activities.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </details>
        </Section>

        <Section id="toolkit" title="Toolkit" kicker="Software used in research and teaching">
          <ul className="chips chips--static">
            {legacy.tools.map((t) => <li key={t} className="chip chip--plain">{t}</li>)}
          </ul>
        </Section>

        <Section id="contact" title="Contact" kicker="Get in touch">
          <ul className="contact">
            <li><span>Institutional</span><a href={`mailto:${links.emailInstitutional}`}>{links.emailInstitutional}</a></li>
            <li><span>Personal</span><a href={`mailto:${links.emailPersonal}`}>{links.emailPersonal}</a></li>
            <li><span>IEEE</span><a href={`mailto:${links.emailIeee}`}>{links.emailIeee}</a></li>
            <li><span>Scholar</span><a href={links.scholar} target="_blank" rel="noreferrer">Google Scholar profile</a></li>
            <li><span>ORCID</span><a href={links.orcid} target="_blank" rel="noreferrer">0000-0002-2535-7159</a></li>
            <li><span>University</span><a href={links.university} target="_blank" rel="noreferrer">CMR University</a></li>
          </ul>
        </Section>
        </ActiveTab.Provider>
      </main>

      <footer className="footer">
        <p>{identity.name} · {identity.org}</p>
      </footer>
    </>
  );
}
