import type { FillRegion, RegionPhotoConfig } from '../types/framefill'

export interface PhotoPlacement {
  dx: number
  dy: number
  dw: number
  dh: number
}

/**
 * 计算照片在模板坐标系下的 cover 适配尺寸（等比缩放，锁定宽高比）。
 * scale = 1 时刚好覆盖整个 region（可能裁掉边缘），>1 放大，<1 缩小。
 * 预览和导出共用此函数，保证两者一致。
 */
export function calculatePhotoPlacement(
  region: FillRegion,
  photoWidth: number,
  photoHeight: number,
  config: RegionPhotoConfig
): PhotoPlacement {
  const photoRatio = photoWidth / photoHeight
  const regionRatio = region.width / region.height

  // cover 适配：保持比例铺满 region，超出部分被裁
  let baseWidth: number
  let baseHeight: number
  if (photoRatio > regionRatio) {
    baseHeight = region.height
    baseWidth = baseHeight * photoRatio
  } else {
    baseWidth = region.width
    baseHeight = baseWidth / photoRatio
  }

  // 等比缩放（锁定宽高比）
  const scaledWidth = baseWidth * config.scale
  const scaledHeight = baseHeight * config.scale

  // 以 cover 中心为基准定位，缩放向中心收缩/扩张，再加上用户偏移
  const baseX = region.x + (region.width - baseWidth) / 2
  const baseY = region.y + (region.height - baseHeight) / 2

  const dx = baseX - (scaledWidth - baseWidth) / 2 + config.offsetX
  const dy = baseY - (scaledHeight - baseHeight) / 2 + config.offsetY

  return { dx, dy, dw: scaledWidth, dh: scaledHeight }
}
