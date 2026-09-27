/**
 * Numeric form fields are held as raw input strings so the box can be cleared
 * while typing. Posted as-is, a cleared box sends `""`, which the API rejects
 * with "Input should be a valid decimal" — the save fails and, because no
 * mutation surfaces its error, the button looks dead.
 *
 * An empty money box means "none", so it is sent as zero. The value is kept a
 * string rather than a number: the API takes decimals, and going through
 * JavaScript's float would be the wrong place to lose precision.
 */
export function money(value: string): string {
  const trimmed = String(value ?? "").trim();
  return trimmed === "" ? "0" : trimmed;
}

/**
 * Line quantity, same idea. A blank quantity means a single item, which is
 * what a new line starts at.
 */
export function quantity(value: number | string): number {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
