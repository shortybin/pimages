export interface ImageInfo {
  name: string
  file: File
  width: number
  height: number
  isHorizontal: boolean
  dataUrl: string
}

export interface Project {
  id: string
  name: string
  images: ImageInfo[]
  layoutType: string
  total: number
  horizontal: number
  vertical: number
  status: 'pending' | 'exporting' | 'completed' | 'error'
}

export interface WatermarkOptions {
  enabled: boolean
  mode: 'single' | 'tile'
  text: string
  fontSize: number
  color: string
  opacity: number
  position: number
  tileMode: 'diagonal' | 'full' | 'grid'
  tileSpacing: number
  tileRotation: number
}

export interface BackgroundOptions {
  preset: string
}

export interface ExportOptions {
  format: 'png' | 'jpeg'
  quality: number
}

export interface BackgroundPreset {
  name: string
  startColor: [number, number, number]
  endColor: [number, number, number]
  isGradient: boolean
}

export interface ImageLayout {
  imageIndex: number
  x: number
  y: number
  width: number
  height: number
}

export interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
}
