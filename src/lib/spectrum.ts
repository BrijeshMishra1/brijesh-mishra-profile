/** Log-frequency geometry for the spectrum ruler. Pure, so it can be tested. */
export const AXIS_MIN_GHZ = 0.5;
export const AXIS_MAX_GHZ = 10000;

export function xFor(ghz: number, width: number): number {
  const clamped = Math.min(Math.max(ghz, AXIS_MIN_GHZ), AXIS_MAX_GHZ);
  const span = Math.log10(AXIS_MAX_GHZ) - Math.log10(AXIS_MIN_GHZ);
  return ((Math.log10(clamped) - Math.log10(AXIS_MIN_GHZ)) / span) * width;
}

/** Polar radiation-pattern path: a main lobe plus side lobes, in a 100x100 box. */
export function patternPath(lobes = 3, steps = 180): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const theta = (i / steps) * Math.PI * 2;
    const r = 18 + 30 * Math.abs(Math.cos((lobes * theta) / 2)) ** 1.4 * (0.55 + 0.45 * Math.cos(theta));
    const x = 50 + r * Math.cos(theta - Math.PI / 2);
    const y = 50 + r * Math.sin(theta - Math.PI / 2);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `${pts.join(" ")} Z`;
}
