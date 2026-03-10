export interface CompressOptions {
  quality: 'high' | 'medium' | 'low'
  lossless: boolean
  outputFormat: 'original' | 'png' | 'jpeg' | 'webp'
}

export interface CompressImageItem {
  id: string
  name: string
  originalFile: File
  compressedFile?: File
  originalSize: number
  compressedSize?: number
  status: 'pending' | 'compressing' | 'completed' | 'error'
  previewUrl?: string
  error?: string
}
