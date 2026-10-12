/**
 * Static backdrop for the portrait: a 2x2 microstrip-patch MIMO board
 * (patch elements with inset feed lines and connectors) tilted behind the
 * figure, with radiating arcs and a via-dot grid. Decorative only.
 */
const BOARD = { x: 6, y: 16, w: 88, h: 74 };
const COLS = 2;
const ROWS = 2;
const PATCH = { w: 22, h: 17 };
const CELL = { w: BOARD.w / COLS, h: BOARD.h / ROWS };

const ELEMENTS = Array.from({ length: COLS * ROWS }, (_, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const cx = BOARD.x + CELL.w * (col + 0.5);
  const top = BOARD.y + CELL.h * row + 7;
  return { key: i, cx, top, feedEnd: BOARD.y + CELL.h * (row + 1) - 3 };
});

const ARC_CENTER = { x: 90, y: 20 };
const ARC_RADII = [9, 16, 23];
const arc = (r: number) =>
  `M${ARC_CENTER.x} ${ARC_CENTER.y - r} A${r} ${r} 0 0 1 ${ARC_CENTER.x + r} ${ARC_CENTER.y}`;

export function HeroBackdrop() {
  return (
    <svg className="backdrop" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="bd-dots" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.45" className="backdrop__dot" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="30" height="44" fill="url(#bd-dots)" />

      <g transform="rotate(-7 50 53)">
        <rect x={BOARD.x} y={BOARD.y} width={BOARD.w} height={BOARD.h} rx="2" className="backdrop__board" />
        {ELEMENTS.map((e) => (
          <g key={e.key}>
            <rect
              x={e.cx - PATCH.w / 2}
              y={e.top}
              width={PATCH.w}
              height={PATCH.h}
              rx="0.8"
              className="backdrop__patch"
            />
            <line x1={e.cx} y1={e.top + PATCH.h} x2={e.cx} y2={e.feedEnd} className="backdrop__feed" />
            <circle cx={e.cx} cy={e.feedEnd} r="1.6" className="backdrop__port" />
          </g>
        ))}
      </g>

      {ARC_RADII.map((r, i) => (
        <path key={r} d={arc(r)} className="backdrop__wave" style={{ opacity: 1 - i * 0.3 }} />
      ))}
    </svg>
  );
}
