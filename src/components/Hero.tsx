import { identity, links, scholar } from "../data/profile";
import { legacy } from "../data/legacy";
import { countByType } from "../lib/publications";
import { Spectrum } from "./Spectrum";
import { Radiation } from "./Radiation";

interface Props {
  onBand: (query: string) => void;
}

export function Hero({ onBand }: Props) {
  const counts = countByType(legacy.publications);
  const readout: [string, number][] = [
    ["citations", scholar.citations],
    ["h-index", scholar.hIndex],
    ["i10-index", scholar.i10Index],
    ["SCI journals", counts.sci],
    ["patents", legacy.patents.length],
    ["edited books", legacy.books.length],
  ];

  return (
    <header className="hero" id="top">
      <div className="hero__top">
      <div className="hero__grid">
        <div className="hero__copy">
          <p className="eyebrow">{identity.credentials.join(" · ")}</p>
          <h1 className="hero__name">{identity.name}</h1>
          <p className="hero__role">{identity.role}</p>
          <p className="hero__org">{identity.org}</p>
          <p className="hero__summary">{identity.summary}</p>
          <div className="hero__actions">
            <a className="btn btn--solid" href={links.scholar} target="_blank" rel="noreferrer">
              Google Scholar
            </a>
            <a className="btn" href={links.orcid} target="_blank" rel="noreferrer">
              ORCID
            </a>
            <a className="btn" href={`mailto:${links.emailInstitutional}`}>
              Email
            </a>
            <button className="btn btn--ghost" type="button" onClick={() => window.print()}>
              Save as PDF
            </button>
          </div>
        </div>
        <figure className="hero__portrait">
          <Radiation />
          <picture>
            <source srcSet={identity.photoCutout} type="image/webp" />
            <img src={identity.photo} alt="Portrait of Dr. Brijesh Mishra" width={640} height={627} />
          </picture>
        </figure>
      </div>
      </div>

      <dl className="readout" aria-label="Research metrics">
        {readout.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="readout__note">Citation metrics from Google Scholar, {scholar.asOf}.</p>

      <Spectrum onPick={onBand} />
    </header>
  );
}
