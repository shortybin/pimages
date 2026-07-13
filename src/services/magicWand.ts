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
  // 用 Uint8Array 替代 Set<number>，位图式 visited 查询 O(1) 且内存紧凑
  const visited = new Uint8Array(width * height)

  // 起始点目标颜色
  const startIdx = (startY * width + startX) * 4
  const targetR = data[startIdx]
  const targetG = data[startIdx + 1]
  const targetB = data[startIdx + 2]

  // 扁平化队列 + 头指针，避免 shift() 的 O(n) 搬移
  const queue = new Uint32Array(width * height)
  let head = 0
  let tail = 0
  const startP = startY * width + startX
  queue[tail++] = startP
  visited[startP] = 1

  while (head < tail) {
    const p = queue[head++]
    const idx = p * 4

    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]

    // 仅当颜色相似时透明化并扩散到邻居
    if (isColorSimilar(r, g, b, targetR, targetG, targetB, tolerance)) {
      newData[idx + 3] = 0

      const x = p % width
      const y = (p - x) / width

      if (x > 0) {
        const np = p - 1
        if (!visited[np]) { visited[np] = 1; queue[tail++] = np }
      }
      if (x < width - 1) {
        const np = p + 1
        if (!visited[np]) { visited[np] = 1; queue[tail++] = np }
      }
      if (y > 0) {
        const np = p - width
        if (!visited[np]) { visited[np] = 1; queue[tail++] = np }
      }
      if (y < height - 1) {
        const np = p + width
        if (!visited[np]) { visited[np] = 1; queue[tail++] = np }
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
