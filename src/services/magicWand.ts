import { isColorSimilar } from '../utils/colorUtils'
import type { Point } from '../types/cutout'

/**
 * Flood fill algorithm for magic wand selection
 * Uses BFS to find all connected pixels with similar colors and makes them transparent
 */
export function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  tolerance: number
): ImageData {
  const { width, height, data } = imageData
  const newData = new Uint8ClampedArray(data)
  const visited = new Set<number>()

  // Get the target color at the starting point
  const startIdx = (startY * width + startX) * 4
  const targetR = data[startIdx]
  const targetG = data[startIdx + 1]
  const targetB = data[startIdx + 2]

  // BFS queue
  const queue: [number, number][] = [[startX, startY]]
  visited.add(startY * width + startX)

  while (queue.length > 0) {
    const [x, y] = queue.shift()!
    const idx = (y * width + x) * 4

    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]

    // Check if this pixel is similar to the target color
    if (isColorSimilar(r, g, b, targetR, targetG, targetB, tolerance)) {
      // Make transparent
      newData[idx + 3] = 0

      // Check 4 neighbors (up, down, left, right)
      const neighbors: [number, number][] = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]

      for (const [nx, ny] of neighbors) {
        // Check bounds
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const key = ny * width + nx
          if (!visited.has(key)) {
            visited.add(key)
            queue.push([nx, ny])
          }
        }
      }
    }
  }

  return new ImageData(newData, width, height)
}

/**
 * Make a rectangular area transparent
 */
export function makeRectangleTransparent(
  imageData: ImageData,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): ImageData {
  const { width, data } = imageData
  const newData = new Uint8ClampedArray(data)

  // Normalize coordinates
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = (y * width + x) * 4
      newData[idx + 3] = 0 // Set alpha to 0
    }
  }

  return new ImageData(newData, imageData.width, imageData.height)
}

/**
 * Make pixels inside a freehand path transparent using point-in-polygon algorithm
 */
export function makeFreehandTransparent(imageData: ImageData, path: Point[]): ImageData {
  const { width, height, data } = imageData
  const newData = new Uint8ClampedArray(data)

  if (path.length < 3) return imageData

  // Find bounding box of the path
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity
  for (const p of path) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }

  // Clamp to image bounds
  minX = Math.max(0, Math.floor(minX))
  maxX = Math.min(width - 1, Math.floor(maxX))
  minY = Math.max(0, Math.floor(minY))
  maxY = Math.min(height - 1, Math.floor(maxY))

  // Check each pixel in bounding box
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (isPointInPolygon({ x, y }, path)) {
        const idx = (y * width + x) * 4
        newData[idx + 3] = 0 // Set alpha to 0
      }
    }
  }

  return new ImageData(newData, width, height)
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  const n = polygon.length

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y
    const xj = polygon[j].x,
      yj = polygon[j].y

    if ((yi > point.y) !== (yj > point.y) && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }

  return inside
}
