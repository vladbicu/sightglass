/**
 * Reference beer colours for SRM 1-40. Interpolating this table tracks real
 * beer far better than the usual exponential approximation, which turns pale
 * ales muddy orange well before they should.
 */
const SRM_TABLE: readonly [number, number, number][] = [
  [255, 230, 153], // 1
  [255, 216, 120],
  [255, 202, 90],
  [255, 191, 66],
  [251, 177, 35], // 5
  [248, 166, 0],
  [243, 156, 0],
  [234, 143, 0],
  [229, 133, 0],
  [222, 124, 0], // 10
  [215, 114, 0],
  [207, 105, 0],
  [203, 98, 0],
  [195, 89, 0],
  [187, 81, 0], // 15
  [181, 76, 0],
  [176, 69, 0],
  [166, 62, 0],
  [161, 55, 0],
  [155, 50, 0], // 20
  [149, 45, 0],
  [142, 41, 0],
  [136, 35, 0],
  [130, 30, 0],
  [123, 26, 0], // 25
  [119, 25, 0],
  [112, 20, 0],
  [106, 14, 0],
  [102, 13, 0],
  [94, 11, 0], // 30
  [90, 10, 2],
  [96, 9, 3],
  [82, 9, 7],
  [76, 5, 5],
  [71, 6, 6], // 35
  [68, 6, 7],
  [63, 7, 8],
  [59, 6, 7],
  [58, 7, 11],
  [54, 8, 10], // 40
]

/** EBC is the European scale for the same thing: EBC ≈ 1.97 × SRM. */
export function srmToEbc(srm: number | null): number | null {
  return srm === null || !Number.isFinite(srm) ? null : srm * 1.97
}

export function ebcToSrm(ebc: number): number {
  return ebc / 1.97
}

/** Returns a CSS rgb() string for an SRM value, clamped to the 1-40 table. */
export function srmToRgb(srm: number | null): string {
  if (srm === null || !Number.isFinite(srm)) return 'rgb(120, 120, 120)'

  const clamped = Math.min(40, Math.max(1, srm))
  const lower = Math.floor(clamped)
  const upper = Math.min(40, lower + 1)
  const t = clamped - lower

  const a = SRM_TABLE[lower - 1]!
  const b = SRM_TABLE[upper - 1]!
  const mix = (i: 0 | 1 | 2) => Math.round(a[i] + (b[i] - a[i]) * t)

  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`
}
