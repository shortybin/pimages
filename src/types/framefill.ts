// 透明区域（复用自 template.ts 的 TransparentRegion）
export interface FillRegion {
  id: string
  x: number
  y: number
  width: number
  height: number
  photoId: string | null  // 分配的图片ID
}

// 填充图片
export interface FillPhoto {
  id: string
  name: string
  dataUrl: string
  width: number
  height: number
  file: File
}

// 区域图片配置（位置/缩放调整）
export interface RegionPhotoConfig {
  offsetX: number      // X偏移（相对于区域居中位置）
  offsetY: number      // Y偏移
  scale: number        // 缩放比例（1 = 完美适配，cover模式）
}

// 模板
export interface FrameTemplate {
  id: string
  name: string
  dataUrl: string       // 透明PNG模板
  width: number
  height: number
  regions: FillRegion[]
}

// 工作流阶段
export type FrameFillStage = 'upload' | 'edit' | 'preview'

// 拖拽状态
export interface DragState {
  isDragging: boolean
  regionId: string | null
  startX: number
  startY: number
  startOffsetX: number
  startOffsetY: number
}
