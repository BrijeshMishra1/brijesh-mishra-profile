/**
 * Static backdrop for the portrait: a Smith-chart motif (constant-resistance
 * circles tangent at one point) over a soft disc and a dot grid.
 * Decorative only; no animation.
 */
const R = 44;
const CX = 50;
const CY = 52;
// Constant-resistance circles of a Smith chart: radius halves, all tangent on the right.
const CIRCLES = [R, R / 2, R / 4, R / 8].map((r) => ({ r, cx: CX + R - r }));

export function HeroBackdrop() {
  return (
    <svg className="backdrop" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="bd-dots" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.45" className="backdrop__dot" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="34" height="46" fill="url(#bd-dots)" />
      <circle cx={CX} cy={CY} r={R} className="backdrop__disc" />
      <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} className="backdrop__line" />
      {CIRCLES.map(({ r, cx }, i) => (
        <circle key={r} cx={cx} cy={CY} r={r} className={i === 1 ? "backdrop__ring backdrop__ring--accent" : "backdrop__ring"} />
      ))}
    </svg>
  );
}
