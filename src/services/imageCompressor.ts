import imageCompression from 'browser-image-compression'
import type { CompressOptions } from '../types/compress'

const QUALITY_SETTINGS: Record<'high' | 'medium' | 'low', { maxSizeMB: number; quality: number }> = {
  high: { maxSizeMB: 5, quality: 0.9 },     // 保持较高画质
  medium: { maxSizeMB: 2, quality: 0.7 },   // 平衡画质和大小
  low: { maxSizeMB: 0.5, quality: 0.5 },    // 最小文件大小
}

export async function compressImage(
  file: File,
  options: CompressOptions
): Promise<{ file: File; originalSize: number; compressedSize: number }> {
  const outputType =
    options.outputFormat === 'original' ? file.type : `image/${options.outputFormat}`

  const { maxSizeMB, quality } = QUALITY_SETTINGS[options.quality]
  const initialQuality = options.lossless ? 1.0 : quality

  const compressedFile = await imageCompression(file, {
    maxSizeMB,
    useWebWorker: true,
    initialQuality,
    fileType: outputType,
  })

  // 如果压缩后比原图大，返回原文件
  if (compressedFile.size >= file.size) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
    }
  }

  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function calculateCompressionRatio(originalSize: number, compressedSize: number): string {
  if (originalSize === 0) return '0%'
  const ratio = ((originalSize - compressedSize) / originalSize) * 100
  return ratio > 0 ? `-${ratio.toFixed(1)}%` : `+${Math.abs(ratio).toFixed(1)}%`
}
