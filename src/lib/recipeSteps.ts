/** Fragment id of the nth (1-based) step on a recipe page; the JSON-LD step `url` points here. */
export function stepAnchorId(position: number): string {
  return `step-${position}`;
}
