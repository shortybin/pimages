import type { ImageInfo, ImageLayout, WatermarkOptions, BackgroundPreset } from '../types'
import { drawWatermark } from '../utils/watermark'
import { loadImage } from '../utils/imageLoader'
import { getBackgroundPreset } from './layoutEngine'

export interface ExportFormatOptions {
  format: 'png' | 'jpeg'
  quality: number  // 0-100，仅 jpeg 生效
}

export async function generateComposite(
  images: ImageInfo[],
  layouts: ImageLayout[],
  canvasWidth: number,
  canvasHeight: number,
  backgroundPreset: BackgroundPreset,
  watermark?: WatermarkOptions,
  exportFormat?: ExportFormatOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    // Draw background
    drawBackground(ctx, canvasWidth, canvasHeight, backgroundPreset)

    // Load and draw images
    const loadPromises = images.map((img) => loadImage(img.dataUrl))

    Promise.all(loadPromises)
      .then((loadedImages) => {
        // Draw images according to layout
        for (const layout of layouts) {
          if (layout.imageIndex < loadedImages.length) {
            const img = loadedImages[layout.imageIndex]
            drawRoundedImage(ctx, img, layout.x, layout.y, layout.width, layout.height)
          }
        }

        // Draw watermark if enabled
        if (watermark) {
          drawWatermark(ctx, watermark, canvasWidth, canvasHeight)
        }

        // Export as blob
        // jpeg 需要白底（透明像素会被填黑），png 保持透明
        if (exportFormat?.format === 'jpeg') {
          const flat = document.createElement('canvas')
          flat.width = canvasWidth
          flat.height = canvasHeight
          const fctx = flat.getContext('2d')!
          fctx.fillStyle = '#ffffff'
          fctx.fillRect(0, 0, canvasWidth, canvasHeight)
          fctx.drawImage(canvas, 0, 0)
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Failed to export canvas as blob'))),
            'image/jpeg',
            Math.max(0, Math.min(1, (exportFormat?.quality ?? 90) / 100))
          )
        } else {
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Failed to export canvas as blob'))),
            'image/png'
          )
        }
      })
      .catch(reject)
  })
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  preset: BackgroundPreset
): void {
  if (preset.isGradient) {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    const [sr, sg, sb] = preset.startColor
    const [er, eg, eb] = preset.endColor
    gradient.addColorStop(0, `rgb(${sr}, ${sg}, ${sb})`)
    gradient.addColorStop(1, `rgb(${er}, ${eg}, ${eb})`)
    ctx.fillStyle = gradient
  } else {
    const [r, g, b] = preset.startColor
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
  }
  ctx.fillRect(0, 0, width, height)
}

function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  cornerRadius: number = 0
): void {
  ctx.save()

  if (cornerRadius > 0) {
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, cornerRadius)
    ctx.clip()
  }

  // Calculate aspect-fit dimensions
  const imgRatio = img.width / img.height
  const targetRatio = width / height

  let drawWidth: number
  let drawHeight: number
  let offsetX = 0
  let offsetY = 0

  if (imgRatio > targetRatio) {
    // Image is wider than target
    drawHeight = height
    drawWidth = height * imgRatio
    offsetX = (width - drawWidth) / 2
  } else {
    // Image is taller than target
    drawWidth = width
    drawHeight = width / imgRatio
    offsetY = (height - drawHeight) / 2
  }

  ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight)
  ctx.restore()
}

export async function processAndExport(
  images: ImageInfo[],
  layouts: ImageLayout[],
  canvasWidth: number,
  canvasHeight: number,
  backgroundName: string,
  watermark?: WatermarkOptions,
  exportFormat?: ExportFormatOptions
): Promise<Blob> {
  const preset = getBackgroundPreset(backgroundName)
  return generateComposite(images, layouts, canvasWidth, canvasHeight, preset, watermark, exportFormat)
}
