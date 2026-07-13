import type { TransparentRegion, PhotoItem, TemplateItem, FitMode } from '../types/template'
import { generateId } from '../utils/id'
import { loadImage } from '../utils/imageLoader'

/**
 * Detect all transparent regions in an image using flood-fill algorithm
 * Returns an array of bounding boxes for each connected transparent region
 */
export function detectAllTransparentRegions(
  imageData: ImageData,
  alphaThreshold = 10,
  minAreaSize = 100
): TransparentRegion[] {
  const { width, height, data } = imageData
  const visited = new Uint8Array(width * height)
  const regions: TransparentRegion[] = []

  // Check if pixel is transparent
  const isTransparent = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false
    const alpha = data[(y * width + x) * 4 + 3]
    return alpha < alphaThreshold
  }

  // Flood fill to find connected region.
  // 使用扁平化 Uint32Array 队列 + 头指针（head）替代 shift()，
  // 避免 O(n) 的数组搬移；大图上性能差异显著。
  // 像素编码为 y * width + x，存入扁平队列。
  const floodFill = (startX: number, startY: number): TransparentRegion | null => {
    let minX = width, minY = height, maxX = 0, maxY = 0
    let pixelCount = 0

    // 队列容量上界 = 图像像素数，足够安全
    const queue = new Uint32Array(width * height)
    let head = 0
    let tail = 0
    queue[tail++] = startY * width + startX

    while (head < tail) {
      const p = queue[head++]
      const x = p % width
      const y = (p - x) / width

      if (visited[p]) continue
      if (!isTransparent(x, y)) continue

      visited[p] = 1
      pixelCount++

      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y

      // 4 邻接：入队前不判 visited，取出时再判（避免重复检查的开销）
      if (x > 0) queue[tail++] = p - 1
      if (x < width - 1) queue[tail++] = p + 1
      if (y > 0) queue[tail++] = p - width
      if (y < height - 1) queue[tail++] = p + width
    }

    if (pixelCount < minAreaSize) return null

    return {
      id: generateId(),
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    }
  }

  // Scan for transparent regions
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (!visited[idx] && isTransparent(x, y)) {
        const region = floodFill(x, y)
        if (region) {
          regions.push(region)
        }
      }
    }
  }

  // Sort regions by position (top-to-bottom, left-to-right)
  regions.sort((a, b) => {
    const centerAY = a.y + a.height / 2
    const centerBY = b.y + b.height / 2
    if (Math.abs(centerAY - centerBY) > 50) {
      return centerAY - centerBY
    }
    return a.x - b.x
  })

  return regions
}

/**
 * Calculate the drawing parameters for fitting a photo into a region
 */
export function calculateFit(
  photoWidth: number,
  photoHeight: number,
  region: TransparentRegion,
  mode: FitMode
): { dx: number; dy: number; dw: number; dh: number } {
  const photoRatio = photoWidth / photoHeight
  const regionRatio = region.width / region.height

  let dw: number, dh: number

  if (mode === 'cover') {
    // Fill the region, may crop
    if (photoRatio > regionRatio) {
      dh = region.height
      dw = dh * photoRatio
    } else {
      dw = region.width
      dh = dw / photoRatio
    }
  } else {
    // Fit completely, may have empty space
    if (photoRatio > regionRatio) {
      dw = region.width
      dh = dw / photoRatio
    } else {
      dh = region.height
      dw = dh * photoRatio
    }
  }

  // Center align
  const dx = region.x + (region.width - dw) / 2
  const dy = region.y + (region.height - dh) / 2

  return { dx, dy, dw, dh }
}

/**
 * Compose multiple regions with different photos
 */
export function composeMultipleRegions(
  templateImg: HTMLImageElement,
  photos: Map<string, HTMLImageElement>,
  regions: TransparentRegion[],
  fitMode: FitMode
): string {
  const canvas = document.createElement('canvas')
  canvas.width = templateImg.width
  canvas.height = templateImg.height
  const ctx = canvas.getContext('2d')!

  // Draw each photo in its assigned region
  for (const region of regions) {
    const photoImg = photos.get(region.id)
    if (!photoImg) continue

    ctx.save()
    // Create clipping path for this region
    ctx.beginPath()
    ctx.rect(region.x, region.y, region.width, region.height)
    ctx.clip()

    // Calculate photo position and size based on fitMode
    const { dx, dy, dw, dh } = calculateFit(
      photoImg.width,
      photoImg.height,
      region,
      fitMode
    )
    ctx.drawImage(photoImg, dx, dy, dw, dh)
    ctx.restore()
  }

  // Draw template (top layer)
  ctx.drawImage(templateImg, 0, 0)

  return canvas.toDataURL('image/png')
}

/**
 * Compose a folder's photos with a template
 * Takes the first N photos (where N = number of regions) and maps them to regions
 */
export async function composeFolderWithTemplate(
  template: TemplateItem,
  photos: PhotoItem[],
  fitMode: FitMode
): Promise<string> {
  const templateImg = await loadImage(template.dataUrl)
  const regions = template.regions

  // Take only the first N photos (where N = number of regions)
  const photosToUse = photos.slice(0, regions.length)

  // Load all photos and map them to region IDs
  const photoMap = new Map<string, HTMLImageElement>()
  for (let i = 0; i < photosToUse.length; i++) {
    const photo = photosToUse[i]
    const region = regions[i]
    if (region) {
      const img = await loadImage(photo.dataUrl)
      photoMap.set(region.id, img)
    }
  }

  return composeMultipleRegions(templateImg, photoMap, regions, fitMode)
}



/**
 * Convert data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}
