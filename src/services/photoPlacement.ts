import type { FillRegion, RegionPhotoConfig } from '../types/framefill'

export interface PhotoPlacement {
  dx: number
  dy: number
  dw: number
  dh: number
}

/**
 * 计算照片在模板坐标系下的渲染位置和尺寸。
 *
 * 纯粹按照片原始尺寸等比缩放，与区域无关：
 *   渲染尺寸 = 照片原始像素 × scale
 * scale = 1 即照片原始大小，宽高始终等比，不会变形。
 * 区域仅作为居中参考点和裁剪窗口，超出部分被裁掉。
 */
export function calculatePhotoPlacement(
  region: FillRegion,
  photoWidth: number,
  photoHeight: number,
  config: RegionPhotoConfig
): PhotoPlacement {
  // 渲染尺寸 = 照片原始尺寸 × scale（锁定照片比例）
  const scaledWidth = photoWidth * config.scale
  const scaledHeight = photoHeight * config.scale

  // 以区域中心为基准居中，再加用户偏移
  const cx = region.x + region.width / 2
  const cy = region.y + region.height / 2
  const dx = cx - scaledWidth / 2 + config.offsetX
  const dy = cy - scaledHeight / 2 + config.offsetY

  return { dx, dy, dw: scaledWidth, dh: scaledHeight }
}
