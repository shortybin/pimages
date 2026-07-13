import { create } from 'zustand'
import { generateId } from '../utils/id'
import { download } from '../utils/download'
import type { CompressOptions, CompressImageItem } from '../types/compress'
import { compressImage } from '../services/imageCompressor'


interface CompressState {
  images: CompressImageItem[]
  options: CompressOptions
  isProcessing: boolean

  // Actions
  addImages: (files: File[]) => Promise<void>
  removeImage: (id: string) => void
  compressAll: () => Promise<void>
  compressImage: (id: string) => Promise<void>
  downloadImage: (id: string) => void
  downloadAll: () => void
  clearAll: () => void
  setOptions: (options: Partial<CompressOptions>) => void
}

export const useCompressStore = create<CompressState>((set, get) => ({
  images: [],
  options: {
    quality: 'medium',
    lossless: false,
    outputFormat: 'original',
  },
  isProcessing: false,

  addImages: async (files: File[]) => {
    const newImages: CompressImageItem[] = []

    for (const file of files) {
      // 检查是否是图片文件（支持 MIME type 为空的情况）
      const isImage = file.type.startsWith('image/') ||
        /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.name)

      if (!isImage) continue

      const previewUrl = URL.createObjectURL(file)
      newImages.push({
        id: generateId(),
        name: file.name,
        originalFile: file,
        originalSize: file.size,
        status: 'pending',
        previewUrl,
      })
    }

    if (newImages.length > 0) {
      set((state) => ({
        images: [...state.images, ...newImages],
      }))
    }
  },

  removeImage: (id: string) => {
    set((state) => {
      const image = state.images.find((img) => img.id === id)
      if (image?.previewUrl) {
        URL.revokeObjectURL(image.previewUrl)
      }
      return {
        images: state.images.filter((img) => img.id !== id),
      }
    })
  },

  compressAll: async () => {
    const { images } = get()
    const pendingImages = images.filter((img) => img.status === 'pending')

    if (pendingImages.length === 0) return

    set({ isProcessing: true })

    for (const image of pendingImages) {
      await get().compressImage(image.id)
    }

    set({ isProcessing: false })
  },

  compressImage: async (id: string) => {
    const { images, options } = get()
    const imageIndex = images.findIndex((img) => img.id === id)

    if (imageIndex === -1) return

    const image = images[imageIndex]

    // Update status to compressing
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, status: 'compressing' as const } : img
      ),
    }))

    try {
      const result = await compressImage(image.originalFile, options)

      set((state) => ({
        images: state.images.map((img) =>
          img.id === id
            ? {
                ...img,
                compressedFile: result.file,
                compressedSize: result.compressedSize,
                status: 'completed' as const,
              }
            : img
        ),
      }))
    } catch (error) {
      set((state) => ({
        images: state.images.map((img) =>
          img.id === id
            ? {
                ...img,
                status: 'error' as const,
                error: error instanceof Error ? error.message : '压缩失败',
              }
            : img
        ),
      }))
    }
  },

  downloadImage: (id: string) => {
    const { images } = get()
    const image = images.find((img) => img.id === id)

    if (!image?.compressedFile) return

    download(image.compressedFile, `compressed_${image.name}`)
  },

  downloadAll: () => {
    const { images } = get()
    const completedImages = images.filter((img) => img.status === 'completed' && img.compressedFile)

    for (const image of completedImages) {
      get().downloadImage(image.id)
    }
  },

  clearAll: () => {
    const { images } = get()

    // Revoke all preview URLs
    for (const image of images) {
      if (image.previewUrl) {
        URL.revokeObjectURL(image.previewUrl)
      }
    }

    set({
      images: [],
      isProcessing: false,
    })
  },

  setOptions: (newOptions: Partial<CompressOptions>) => {
    set((state) => ({
      options: { ...state.options, ...newOptions },
    }))
  },
}))
