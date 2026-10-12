import { bands } from "../data/profile";
import { AXIS_MAX_GHZ, AXIS_MIN_GHZ, xFor } from "../lib/spectrum";

const W = 1000;
const TICKS = [1, 10, 100, 1000, 10000];
const TICK_LABEL: Record<number, string> = { 1: "1 GHz", 10: "10", 100: "100", 1000: "1 THz", 10000: "10 THz" };

interface Props {
  onPick: (query: string) => void;
}

/** A log-frequency ruler. Each band is a control that searches the publications. */
export function Spectrum({ onPick }: Props) {
  return (
    <section className="spectrum" aria-labelledby="spectrum-title">
      <div className="spectrum__head">
        <h2 id="spectrum-title" className="spectrum__title">
          Where the work sits
        </h2>
        <p className="spectrum__hint">Log frequency, {AXIS_MIN_GHZ} GHz to {AXIS_MAX_GHZ / 1000} THz. Pick a band to search the papers.</p>
      </div>
      <div className="spectrum__bands" role="group" aria-label="Frequency bands">
        {bands.map((b) => {
          const left = (xFor(b.startGHz, W) / W) * 100;
          const width = ((xFor(b.endGHz, W) - xFor(b.startGHz, W)) / W) * 100;
          return (
            <button
              key={b.id}
              type="button"
              className={`spectrum__band spectrum__band--${b.id}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              onClick={() => onPick(b.query)}
              title={`Search papers: ${b.query}`}
            >
              <span>{b.label}</span>
            </button>
          );
        })}
      </div>
      <svg className="spectrum__axis" viewBox={`0 0 ${W} 34`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <line x1="0" y1="2" x2={W} y2="2" />
        {TICKS.map((t) => {
          const x = xFor(t, W);
          return (
            <g key={t}>
              <line x1={x} y1="2" x2={x} y2="12" />
            </g>
          );
        })}
      </svg>
      <div className="spectrum__labels" aria-hidden="true">
        {TICKS.map((t) => (
          <span key={t} style={{ left: `${(xFor(t, W) / W) * 100}%` }}>
            {TICK_LABEL[t]}
          </span>
        ))}
      </div>
    </section>
  );
}
