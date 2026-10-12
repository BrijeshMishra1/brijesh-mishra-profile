/** Log-frequency geometry for the spectrum ruler. Pure, so it can be tested. */
export const AXIS_MIN_GHZ = 0.5;
export const AXIS_MAX_GHZ = 10000;

export function xFor(ghz: number, width: number): number {
  const clamped = Math.min(Math.max(ghz, AXIS_MIN_GHZ), AXIS_MAX_GHZ);
  const span = Math.log10(AXIS_MAX_GHZ) - Math.log10(AXIS_MIN_GHZ);
  return ((Math.log10(clamped) - Math.log10(AXIS_MIN_GHZ)) / span) * width;
}
