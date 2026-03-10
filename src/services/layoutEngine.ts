import type { ImageInfo, ImageLayout, BackgroundPreset } from '../types'

export const backgroundPresets: BackgroundPreset[] = [
  { name: '暖米色', startColor: [245, 230, 211], endColor: [215, 205, 181], isGradient: true },
  { name: '纯白色', startColor: [255, 255, 255], endColor: [255, 255, 255], isGradient: false },
  { name: '浅灰色', startColor: [248, 250, 252], endColor: [241, 245, 249], isGradient: true },
  { name: '柔粉色', startColor: [255, 240, 245], endColor: [255, 228, 225], isGradient: true },
  { name: '薄荷绿', startColor: [240, 255, 250], endColor: [224, 255, 240], isGradient: true },
  { name: '浅紫色', startColor: [250, 245, 255], endColor: [240, 230, 245], isGradient: true },
  { name: '奶咖色', startColor: [250, 240, 220], endColor: [230, 215, 195], isGradient: true },
]

interface ImageWeight {
  index: number
  area: number
  ratio: number
  isHorizontal: boolean
}

export function determineLayoutType(images: ImageInfo[]): string {
  const horizontal = images.filter(i => i.isHorizontal).length
  const vertical = images.length - horizontal

  if (horizontal >= 2 && vertical >= 1) return '2横+1竖'
  if (horizontal >= 1 && vertical >= 2) return '1横+2竖'
  if (horizontal >= 3) return '3横'
  if (vertical >= 3) return '3竖'
  return '混合'
}

export function calculateLayouts(
  images: ImageInfo[],
  padding: number = 30,
  gap: number = 20
): { canvasWidth: number; canvasHeight: number; layouts: ImageLayout[] } {
  const totalCount = images.length
  if (totalCount === 0) {
    return { canvasWidth: 600, canvasHeight: 600, layouts: [] }
  }

  const weights: ImageWeight[] = images.map((img, i) => ({
    index: i,
    area: img.width * img.height,
    ratio: img.width / img.height,
    isHorizontal: img.isHorizontal,
  }))

  const sortedWeights = [...weights].sort((a, b) => b.area - a.area)

  const horizontalCount = images.filter(i => i.isHorizontal).length
  const verticalCount = totalCount - horizontalCount

  const maxSourceDim = Math.max(...images.map(i => Math.max(i.width, i.height)))
  const countFactor = totalCount <= 1 ? 0.8 : totalCount <= 2 ? 0.6 : totalCount <= 3 ? 0.5 : totalCount <= 4 ? 0.45 : 0.4
  const baseSize = Math.min(Math.max(Math.floor(maxSourceDim * countFactor), 600), 2000)

  const result = calculateLayoutForCount(
    images,
    weights,
    sortedWeights,
    horizontalCount,
    verticalCount,
    padding,
    gap,
    baseSize
  )

  return result
}

function calculateLayoutForCount(
  images: ImageInfo[],
  weights: ImageWeight[],
  sortedWeights: ImageWeight[],
  horizontalCount: number,
  verticalCount: number,
  padding: number,
  gap: number,
  baseSize: number
): { canvasWidth: number; canvasHeight: number; layouts: ImageLayout[] } {
  const totalCount = images.length

  // 3 images layouts
  if (totalCount === 3 && horizontalCount === 2 && verticalCount === 1) {
    return layout3_2H1V(weights, padding, gap, baseSize)
  }
  if (totalCount === 3 && horizontalCount === 1 && verticalCount === 2) {
    return layout3_1H2V(weights, padding, gap, baseSize)
  }
  if (totalCount === 3 && horizontalCount === 3) {
    return layout3H(sortedWeights, weights, padding, gap, baseSize)
  }
  if (totalCount === 3 && verticalCount === 3) {
    return layout3V(sortedWeights, weights, padding, gap, baseSize)
  }

  // 4 images layouts
  if (totalCount === 4 && horizontalCount === 2 && verticalCount === 2) {
    return layout4_2H2V(weights, padding, gap, baseSize)
  }
  if (totalCount === 4 && horizontalCount === 1 && verticalCount === 3) {
    return layout4_1H3V(weights, padding, gap, baseSize)
  }
  if (totalCount === 4 && horizontalCount === 3 && verticalCount === 1) {
    return layout4_3H1V(weights, padding, gap, baseSize)
  }
  if (totalCount === 4 && horizontalCount === 4) {
    return layout4H(sortedWeights, weights, padding, gap, baseSize)
  }
  if (totalCount === 4 && verticalCount === 4) {
    return layout4V(sortedWeights, weights, padding, gap, baseSize)
  }
  if (totalCount === 4) {
    return layout4Mixed(sortedWeights, weights, padding, gap, baseSize)
  }

  // 1-2 images
  if (totalCount <= 2) {
    return layout1to2(weights, padding, gap, baseSize)
  }

  // 5+ images - 2 column grid
  return layoutGrid(weights, padding, gap, baseSize)
}

// 3 images: 2 horizontal + 1 vertical
function layout3_2H1V(
  weights: ImageWeight[],
  padding: number,
  gap: number,
  baseSize: number
): { canvasWidth: number; canvasHeight: number; layouts: ImageLayout[] } {
  const vIdx = weights.find(w => !w.isHorizontal)!.index
  const hIndices = weights.filter(w => w.isHorizontal).map(w => w.index)

  const leftH = baseSize
  const totalHeight = leftH * 2 + gap

  const w1 = Math.floor(leftH * weights[hIndices[0]].ratio)
  const w2 = Math.floor(leftH * weights[hIndices[1]].ratio)
  const leftW = Math.max(w1, w2)

  const rightW = Math.floor(totalHeight * weights[vIdx].ratio)

  const canvasW = padding * 2 + leftW + gap + rightW
  const canvasH = padding * 2 + totalHeight

  const x1 = padding + Math.floor((leftW - w1) / 2)
  const x2 = padding + Math.floor((leftW - w2) / 2)
  const x3 = padding + leftW + gap

  return {
    canvasWidth: canvasW,
    canvasHeight: canvasH,
    layouts: [
      { imageIndex: hIndices[0], x: x1, y: padding, width: w1, height: leftH },
      { imageIndex: hIndices[1], x: x2, y: padding + leftH + gap, width: w2, height: leftH },
      { imageIndex: vIdx, x: x3, y: padding, width: rightW, height: totalHeight },
    ],
  }
}

// 3 images: 1 horizontal + 2 vertical
function layout3_1H2V(
  weights: ImageWeight[],
  padding: number,
  gap: number,
  baseSize: number
): { canvasWidth: number; canvasHeight: number; layouts: ImageLayout[] } {
  const hIdx = weights.find(w => w.isHorizontal)!.index
  const vIndices = weights.filter(w => !w.isHorizontal).map(w => w.index)

  const topW = baseSize + 100
  const topH = Math.floor(topW / weights[hIdx].ratio)

  const bottomH = baseSize
  const w2 = Math.floor(bottomH * weights[vIndices[0]].ratio)
  const w3 = Math.floor(bottomH * weights[vIndices[1]].ratio)
  const bottomW = w2 + gap + w3

  const canvasW = padding * 2 + Math.max(topW, bottomW)
  const canvasH = padding * 2 + topH + gap + bottomH

  const topX = padding + Math.floor((canvasW - padding * 2 - topW) / 2)
  const bottomX = padding + Math.floor((canvasW - padding * 2 - bottomW) / 2)

  return {
    canvasWidth: canvasW,
    canvasHeight: canvasH,
    layouts: [
      { imageIndex: hIdx, x: topX, y: padding, width: topW, height: topH },
      { imageIndex: vIndices[0], x: bottomX, y: padding + topH + gap, width: w2, height: bottomH },
      { imageIndex: vIndices[1], x: bottomX + w2 + gap, y: padding + topH + gap, width: w3, height: bottomH },
    ],
  }
}

// 3 horizontal images
function layout3H(
  sortedWeights: ImageWeight[],
  weights: ImageWeight[],
  padding: number,
  gap: number,
  baseSize: number
): { canvasWidth: number; canvasHeight: number; layouts: ImageLayout[] } {
  const [h1, h2, h3] = sortedWeights.map(w => w.index)

  const commonH = baseSize
  const w1 = Math.floor(commonH * weights[h1].ratio)
  const w2 = Math.floor(commonH * weights[h2].ratio)
  const w3 = Math.floor(commonH * weights[h3].ratio)
  const commonW = Math.max(w1, w2, w3)

  const actualH1 = Math.floor(commonW / weights[h1].ratio)
  const actualH2 = Math.floor(commonW / weights[h2].ratio)
  const actualH3 = Math.floor(commonW / weights[h3].ratio)
  const totalH = actualH1 + gap + actualH2 + gap + actualH3

  const canvasW = padding * 2 + commonW
  const canvasH = padding * 2 + totalH

  const y1 = padding
  const y2 = padding + actualH1 + gap
  const y3 = padding + actualH1 + gap + actualH2 + gap

  return {
    canvasWidth: canvasW,
    canvasHeight: canvasH,
    layouts: [
      { imageIndex: h1, x: padding, y: y1, width: commonW, height: actualH1 },
      { imageIndex: h2, x: padding, y: y2, width: commonW, height: actualH2 },
      { imageIndex: h3, x: padding, y: y3, width: commonW, height: actualH3 },
    ],
  }
}

// 3 vertical images
function layout3V(
  sortedWeights: ImageWeight[],
  weights: ImageWeight[],
  padding: number,
  gap: number,
  baseSize: number
): { canvasWidth: number; canvasHeight: number; layouts: ImageLayout[] } {
  const [top, bottom1, bottom2] = sortedWeights.map(w => w.index)

  const commonSize = baseSize
  const topW = commonSize
  const topH = Math.floor(commonSize / weights[top].ratio)

  const bottomW = commonSize
  const bottomH = Math.floor(commonSize / weights[bottom1].ratio)

  const bottomTotalW = bottomW + gap + bottomW

  const canvasW = padding * 2 + bottomTotalW
  const canvasH = padding * 2 + topH + gap + bottomH

  const topX = padding + Math.floor((bottomTotalW - topW) / 2)
  const bottomX = padding

  return {
    canvasWidth: canvasW,
    canvasHeight: canvasH,
    layouts: [
      { imageIndex: top, x: topX, y: padding, width: topW, height: topH },
      { imageIndex: bottom1, x: bottomX, y: padding + topH + gap, width: bottomW, height: bottomH },
      { imageIndex: bottom2, x: bottomX + bottomW + gap, y: padding + topH + gap, width: bottomW, height: bottomH },
    ],
  }
}

// 4 images: 2 horizontal + 2 vertical
function layout4_2H2V(
  weights: ImageWeight[],
  padding: number,
  gap: number,
  baseSize: number
): { canvasWidth: number; canvasHeight: number; layouts: ImageLayout[] } {
  const hIndices = weights.filter(w => w.isHorizontal).map(w => w.index)
  const vIndices = weights.filter(w => !w.isHorizontal).map(w => w.index)

  const leftH = baseSize
  const w1 = Math.floor(leftH * weights[hIndices[0]].ratio)
  const w2 = Math.floor(leftH * weights[hIndices[1]].ratio)
  const leftW = Math.max(w1, w2)

  const rightEachH = baseSize
  const rightTotalH = rightEachH * 2 + gap
  const w3 = Math.floor(rightEachH * weights[vIndices[0]].ratio)
  const w4 = Math.floor(rightEachH * weights[vIndices[1]].ratio)
  const rightW = Math.max(w3, w4)

  const totalH = Math.max(leftH * 2 + gap, rightTotalH)
  const canvasW = padding * 2 + leftW + gap + rightW
  const canvasH = padding * 2 + totalH

  const leftYOffset = leftH * 2 + gap < totalH ? Math.floor((totalH - (leftH * 2 + gap)) / 2) : 0
  const rightYOffset = rightTotalH < totalH ? Math.floor((totalH - rightTotalH) / 2) : 0

  const x1 = padding + Math.floor((leftW - w1) / 2)
  const x2 = padding + Math.floor((leftW - w2) / 2)
  const x3 = padding + leftW + gap + Math.floor((rightW - w3) / 2)
  const x4 = padding + leftW + gap + Math.floor((rightW - w4) / 2)

  return {
    canvasWidth: canvasW,
    canvasHeight: canvasH,
    layouts: [
      { imageIndex: hIndices[0], x: x1, y: padding + leftYOffset, width: w1, height: leftH },
      { imageIndex: hIndices[1], x: x2, y: padding + leftH + gap + leftYOffset, width: w2, height: leftH },
      { imageIndex: vIndices[0], x: x3, y: padding + rightYOffset, width: w3, height: rightEachH },
      { imageIndex: vIndices[1], x: x4, y: padding + rightEachH + gap + rightYOffset, width: w4, height: rightEachH },
    ],
  }
}

// 4 images: 1 horizontal + 3 vertical
function layout4_1H3V(
  weights: ImageWeight[],
  padding: number,
  gap: number,
  baseSize: number
): { canvasWidth: number; canvasHeight: number; layouts: ImageLayout[] } {
  const hIdx = weights.find(w => w.isHorizontal)!.index
  const vIndices = weights.filter(w => !w.isHorizontal).map(w => w.index)

  const topW = baseSize + 100
  const topH = Math.floor(topW / weights[hIdx].ratio)

  const bottomH = Math.floor(baseSize * 2 / 3)
  const widths = vIndices.map(i => Math.floor(bottomH * weights[i].ratio))
  const bottomW = widths.reduce((a, b) => a + gap + b, -gap)

  const canvasW = padding * 2 + Math.max(topW, bottomW)
  const canvasH = padding * 2 + topH + gap + bottomH

  const topX = padding + Math.floor((canvasW - padding * 2 - topW) / 2)
  const bottomX = padding + Math.floor((canvasW - padding * 2 - bottomW) / 2)

  const layouts: ImageLayout[] = [
    { imageIndex: hIdx, x: topX, y: padding, width: topW, height: topH },
  ]

  let currentX = bottomX
  for (let i = 0; i < vIndices.length; i++) {
    layouts.push({
      imageIndex: vIndices[i],
      x: currentX,
      y: padding + topH + gap,
      width: widths[i],
      height: bottomH,
    })
    currentX += widths[i] + gap
  }

  return { canvasWidth: canvasW, canvasHeight: canvasH, layouts }
}

// 4 images: 3 horizontal + 1 vertical
function layout4_3H1V(
  weights: ImageWeight[],
  padding: number,
  gap: number,
  baseSize: number
): { canvasWidth: number; canvasHeight: number; layouts: ImageLayout[] } {
  const vIdx = weights.find(w => !w.isHorizontal)!.index
  const hIndices = weights.filter(w => w.isHorizontal).map(w => w.index)

  const leftH = Math.floor(baseSize * 3 / 4)
  const widths = hIndices.map(i => Math.floor(leftH * weights[i].ratio))
  const leftW = Math.max(...widths)

  const leftTotalH = leftH * 3 + gap * 2
  const rightW = Math.floor(leftTotalH * weights[vIdx].ratio)

  const canvasW = padding * 2 + leftW + gap + rightW
  const canvasH = padding * 2 + leftTotalH

  const layouts: ImageLayout[] = []
  for (let i = 0; i < hIndices.length; i++) {
    const x = padding + Math.floor((leftW - widths[i]) / 2)
    const y = padding + i * (leftH + gap)
    layouts.push({ imageIndex: hIndices[i], x, y, width: widths[i], height: leftH })
  }

  layouts.push({
    imageIndex: vIdx,
    x: padding + leftW + gap,
    y: padding,
    width: rightW,
    height: leftTotalH,
  })

  return { canvasWidth: canvasW, canvasHeight: canvasH, layouts }
}

// 4 horizontal images - 2x2 grid
function layout4H(
  sortedWeights: ImageWeight[],
  weights: ImageWeight[],
  padding: number,
  gap: number,
  baseSize: number
): { canvasWidth: number; canvasHeight: number; layouts: ImageLayout[] } {
  const indices = sortedWeights.map(w => w.index)

  const commonH = Math.floor(baseSize * 3 / 4)
  const widths = indices.map(i => Math.floor(commonH * weights[i].ratio))
  const commonW = Math.max(...widths)

  const actualHeights = indices.map(i => Math.floor(commonW / weights[i].ratio))
  const row1H = Math.max(actualHeights[0], actualHeights[1])
  const row2H = Math.max(actualHeights[2], actualHeights[3])
  const totalH = row1H + gap + row2H

  const canvasW = padding * 2 + commonW * 2 + gap
  const canvasH = padding * 2 + totalH

  return {
    canvasWidth: canvasW,
    canvasHeight: canvasH,
    layouts: [
      { imageIndex: indices[0], x: padding, y: padding, width: commonW, height: actualHeights[0] },
      { imageIndex: indices[1], x: padding + commonW + gap, y: padding, width: commonW, height: actualHeights[1] },
      { imageIndex: indices[2], x: padding, y: padding + row1H + gap, width: commonW, height: actualHeights[2] },
      { imageIndex: indices[3], x: padding + commonW + gap, y: padding + row1H + gap, width: commonW, height: actualHeights[3] },
    ],
  }
}

// 4 vertical images - 2x2 grid
function layout4V(
  sortedWeights: ImageWeight[],
  weights: ImageWeight[],
  padding: number,
  gap: number,
  baseSize: number
): { canvasWidth: number; canvasHeight: number; layouts: ImageLayout[] } {
  const indices = sortedWeights.map(w => w.index)

  const commonW = baseSize
  const heights = indices.map(i => Math.floor(commonW / weights[i].ratio))
  const commonH = Math.max(...heights)

  const actualWidths = indices.map(i => Math.floor(commonH * weights[i].ratio))
  const col1W = Math.max(actualWidths[0], actualWidths[2])
  const col2W = Math.max(actualWidths[1], actualWidths[3])
  const totalW = col1W + gap + col2W

  const canvasW = padding * 2 + totalW
  const canvasH = padding * 2 + commonH * 2 + gap

  return {
    canvasWidth: canvasW,
    canvasHeight: canvasH,
    layouts: [
      { imageIndex: indices[0], x: padding, y: padding, width: actualWidths[0], height: commonH },
      { imageIndex: indices[1], x: padding + col1W + gap, y: padding, width: actualWidths[1], height: commonH },
      { imageIndex: indices[2], x: padding, y: padding + commonH + gap, width: actualWidths[2], height: commonH },
      { imageIndex: indices[3], x: padding + col1W + gap, y: padding + commonH + gap, width: actualWidths[3], height: commonH },
    ],
  }
}

// 4 mixed images - 2x2 grid
function layout4Mixed(
  sortedWeights: ImageWeight[],
  weights: ImageWeight[],
  padding: number,
  gap: number,
  baseSize: number
): { canvasWidth: number; canvasHeight: number; layouts: ImageLayout[] } {
  const indices = sortedWeights.map(w => w.index)

  const commonSize = baseSize
  const widths = indices.map(i => Math.floor(commonSize * weights[i].ratio))
  const commonW = Math.max(...widths)

  const heights = indices.map(i => Math.floor(commonW / weights[i].ratio))
  const row1H = Math.max(heights[0], heights[1])
  const row2H = Math.max(heights[2], heights[3])
  const totalH = row1H + gap + row2H

  const canvasW = padding * 2 + commonW * 2 + gap
  const canvasH = padding * 2 + totalH

  return {
    canvasWidth: canvasW,
    canvasHeight: canvasH,
    layouts: [
      { imageIndex: indices[0], x: padding, y: padding, width: commonW, height: heights[0] },
      { imageIndex: indices[1], x: padding + commonW + gap, y: padding, width: commonW, height: heights[1] },
      { imageIndex: indices[2], x: padding, y: padding + row1H + gap, width: commonW, height: heights[2] },
      { imageIndex: indices[3], x: padding + commonW + gap, y: padding + row1H + gap, width: commonW, height: heights[3] },
    ],
  }
}

// 1-2 images - horizontal layout
function layout1to2(
  weights: ImageWeight[],
  padding: number,
  gap: number,
  baseSize: number
): { canvasWidth: number; canvasHeight: number; layouts: ImageLayout[] } {
  const h = baseSize
  const widths = weights.map(w => Math.floor(h * w.ratio))
  const gapCount = weights.length > 1 ? weights.length - 1 : 0
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * gapCount

  const canvasW = padding * 2 + totalW
  const canvasH = padding * 2 + h

  const layouts: ImageLayout[] = []
  let currentX = padding

  for (let i = 0; i < weights.length; i++) {
    layouts.push({
      imageIndex: weights[i].index,
      x: currentX,
      y: padding,
      width: widths[i],
      height: h,
    })
    currentX += widths[i] + gap
  }

  return { canvasWidth: canvasW, canvasHeight: canvasH, layouts }
}

// 5+ images - 2 column grid
function layoutGrid(
  weights: ImageWeight[],
  padding: number,
  gap: number,
  baseSize: number
): { canvasWidth: number; canvasHeight: number; layouts: ImageLayout[] } {
  const cols = 2
  const rows = Math.ceil(weights.length / cols)

  const cellH = Math.floor(baseSize * 3 / 4)
  const cellWidths = weights.map(w => Math.floor(cellH * w.ratio))
  const maxCellW = Math.max(...cellWidths)

  const canvasW = padding * 2 + maxCellW * cols + gap * (cols - 1)
  const canvasH = padding * 2 + cellH * rows + gap * (rows - 1)

  const layouts: ImageLayout[] = []
  for (let i = 0; i < weights.length; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols
    const x = padding + col * (maxCellW + gap) + Math.floor((maxCellW - cellWidths[i]) / 2)
    const y = padding + row * (cellH + gap)
    layouts.push({
      imageIndex: weights[i].index,
      x,
      y,
      width: cellWidths[i],
      height: cellH,
    })
  }

  return { canvasWidth: canvasW, canvasHeight: canvasH, layouts }
}

export function getBackgroundPreset(name: string): BackgroundPreset {
  return backgroundPresets.find(p => p.name === name) || backgroundPresets[0]
}
