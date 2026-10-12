import { patternPath } from "../lib/spectrum";

const PATH = patternPath(3);
const RINGS = [16, 28, 40];

/** Decorative polar radiation pattern behind the portrait. */
export function Radiation() {
  return (
    <svg className="radiation" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {RINGS.map((r) => (
        <circle key={r} cx="50" cy="50" r={r} className="radiation__ring" />
      ))}
      <line x1="50" y1="4" x2="50" y2="96" className="radiation__ring" />
      <line x1="4" y1="50" x2="96" y2="50" className="radiation__ring" />
      <path d={PATH} className="radiation__lobe" pathLength={1} />
    </svg>
  );
}
