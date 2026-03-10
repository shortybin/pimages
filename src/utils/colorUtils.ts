/**
 * Calculate weighted Euclidean distance between two colors
 * Uses human perception-based weights for better results
 */
export function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  // Weighted Euclidean distance with human perception weights
  // Red: 0.3, Green: 0.59, Blue: 0.11
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2

  return Math.sqrt(0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db)
}

/**
 * Check if two colors are similar within tolerance
 */
export function isColorSimilar(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
  tolerance: number
): boolean {
  return colorDistance(r1, g1, b1, r2, g2, b2) <= tolerance
}
