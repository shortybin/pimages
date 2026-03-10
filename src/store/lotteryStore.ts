import { create } from 'zustand'
import type { LotteryImage, LotterySettings } from '../types/lottery'
import { defaultLotterySettings } from '../types/lottery'

const generateId = () => Math.random().toString(36).substring(2, 15)

interface LotteryWinner {
  id: string
  image: LotteryImage
  drawnAt: number
}

interface LotteryState {
  images: LotteryImage[]
  winners: LotteryWinner[]
  drawnIds: string[]
  settings: LotterySettings
  isRunning: boolean
  isFullscreen: boolean

  // Actions
  addImages: (files: File[], nameFilter?: string[]) => void
  removeImage: (id: string) => void
  clearImages: () => void
  setSettings: (settings: Partial<LotterySettings>) => void
  draw: () => LotteryImage[]
  resetDrawn: () => void
  clearWinners: () => void
  setRunning: (running: boolean) => void
  setFullscreen: (fullscreen: boolean) => void
}

export const useLotteryStore = create<LotteryState>((set, get) => ({
  images: [],
  winners: [],
  drawnIds: [],
  settings: defaultLotterySettings,
  isRunning: false,
  isFullscreen: false,

  addImages: (files: File[], nameFilter?: string[]) => {
    const newImages: LotteryImage[] = []

    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      if (!isImage) continue

      if (nameFilter && nameFilter.length > 0) {
        const matches = nameFilter.some(name => file.name === name.trim())
        if (!matches) continue
      }

      newImages.push({
        id: generateId(),
        name: file.name,
        url: URL.createObjectURL(file),
        originalFile: file,
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
      const image = state.images.find(img => img.id === id)
      if (image) {
        URL.revokeObjectURL(image.url)
      }
      return {
        images: state.images.filter(img => img.id !== id),
      }
    })
  },

  clearImages: () => {
    const { images } = get()
    images.forEach(img => URL.revokeObjectURL(img.url))
    set({ images: [], winners: [], drawnIds: [] })
  },

  setSettings: (newSettings: Partial<LotterySettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }))
  },

  draw: () => {
    const { images, drawnIds, settings, winners } = get()

    const availableImages = settings.noRepeat
      ? images.filter(img => !drawnIds.includes(img.id))
      : images

    if (availableImages.length === 0) return []

    const count = Math.min(settings.winnerCount, availableImages.length)
    const shuffled = [...availableImages].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, count)

    const newWinners: LotteryWinner[] = selected.map(img => ({
      id: generateId(),
      image: img,
      drawnAt: Date.now(),
    }))

    const newDrawnIds = settings.noRepeat
      ? [...drawnIds, ...selected.map(img => img.id)]
      : drawnIds

    set({
      winners: [...winners, ...newWinners],
      drawnIds: newDrawnIds,
    })

    return selected
  },

  resetDrawn: () => {
    set({ drawnIds: [] })
  },

  clearWinners: () => {
    set({ winners: [] })
  },

  setRunning: (running: boolean) => {
    set({ isRunning: running })
  },

  setFullscreen: (fullscreen: boolean) => {
    set({ isFullscreen: fullscreen })
  },
}))
