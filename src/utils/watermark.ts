import type { WatermarkOptions } from '../types'

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  watermark: WatermarkOptions,
  canvasWidth: number,
  canvasHeight: number
): void {
  if (!watermark.enabled || !watermark.text) {
    return
  }

  ctx.save()
  ctx.globalAlpha = watermark.opacity / 100

  if (watermark.mode === 'single') {
    drawSingleWatermark(ctx, watermark, canvasWidth, canvasHeight)
  } else {
    drawTiledWatermark(ctx, watermark, canvasWidth, canvasHeight)
  }

  ctx.restore()
}

function drawSingleWatermark(
  ctx: CanvasRenderingContext2D,
  watermark: WatermarkOptions,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.font = `${watermark.fontSize}px Arial, sans-serif`
  ctx.fillStyle = watermark.color
  ctx.textBaseline = 'top'

  const textMetrics = ctx.measureText(watermark.text)
  const textWidth = textMetrics.width
  const textHeight = watermark.fontSize

  const positions = [
    { x: 20, y: 20 },
    { x: (canvasWidth - textWidth) / 2, y: 20 },
    { x: canvasWidth - textWidth - 20, y: 20 },
    { x: 20, y: (canvasHeight - textHeight) / 2 },
    { x: (canvasWidth - textWidth) / 2, y: (canvasHeight - textHeight) / 2 },
    { x: canvasWidth - textWidth - 20, y: (canvasHeight - textHeight) / 2 },
    { x: 20, y: canvasHeight - textHeight - 20 },
    { x: (canvasWidth - textWidth) / 2, y: canvasHeight - textHeight - 20 },
    { x: canvasWidth - textWidth - 20, y: canvasHeight - textHeight - 20 },
  ]

  const pos = positions[Math.min(watermark.position - 1, positions.length)]
  if (pos) {
    ctx.fillText(watermark.text, pos.x, pos.y)
  }
}

function drawTiledWatermark(
  ctx: CanvasRenderingContext2D,
  watermark: WatermarkOptions,
  canvasWidth: number,
  canvasHeight: number
): void {
  const spacing = watermark.tileSpacing
  const rotation = watermark.tileRotation * Math.PI / 180

  ctx.font = `${watermark.fontSize}px Arial, sans-serif`
  ctx.fillStyle = watermark.color
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  const cols = Math.ceil(canvasWidth / spacing) + 2
  const rows = Math.ceil(canvasHeight / spacing) + 2

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const baseX = col * spacing
      const baseY = row * spacing

      const diagOffset = (col - row) * spacing / 3

      const x = baseX + diagOffset
      const y = baseY

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.fillText(watermark.text, 0, 0)
      ctx.restore()
    }
  }
}
