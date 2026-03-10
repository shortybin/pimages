import { create } from 'zustand'
import type { CutoutImage, SelectionMode, HistoryState } from '../types/cutout'

const generateId = () => Math.random().toString(36).substring(2, 15)

interface CutoutState {
  image: CutoutImage | null
  selectionMode: SelectionMode
  tolerance: number
  history: HistoryState[]
  historyIndex: number
  zoom: number
  canvasUpdateKey: number // Used to trigger canvas updates
  resetKey: number // Incremented on reset to trigger canvas reload

  // Rectangle mode controls
  rectX: number
  rectY: number
  rectWidth: number
  rectHeight: number

  // Actions
  setImage: (file: File) => Promise<void>
  updateProcessedImage: (dataUrl: string) => void
  setSelectionMode: (mode: SelectionMode) => void
  setTolerance: (tolerance: number) => void
  saveToHistory: (imageData: ImageData) => void
  undo: () => void
  canUndo: () => boolean
  reset: () => void
  setZoom: (zoom: number) => void
  downloadImage: () => void
  clearAll: () => void

  // Rectangle controls
  setRectX: (v: number) => void
  setRectY: (v: number) => void
  setRectWidth: (v: number) => void
  setRectHeight: (v: number) => void
  setRectFromDrag: (x: number, y: number, width: number, height: number) => void
  applyRectCutout: () => void
}

export const useCutoutStore = create<CutoutState>((set, get) => ({
  image: null,
  selectionMode: 'magicWand',
  tolerance: 30,
  history: [],
  historyIndex: -1,
  zoom: 1,
  canvasUpdateKey: 0,
  resetKey: 0,
  rectX: 0,
  rectY: 0,
  rectWidth: 100,
  rectHeight: 100,

  setImage: async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const img = new Image()
        img.onload = () => {
          const cutoutImage: CutoutImage = {
            id: generateId(),
            name: file.name,
            originalDataUrl: dataUrl,
            processedDataUrl: dataUrl,
            width: img.width,
            height: img.height,
          }
          set({
            image: cutoutImage,
            history: [],
            historyIndex: -1,
            zoom: 1,
            canvasUpdateKey: 0,
            resetKey: 0,
          })
          resolve()
        }
        img.onerror = reject
        img.src = dataUrl
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  },

  updateProcessedImage: (dataUrl: string) => {
    set((state) => {
      if (!state.image) return state
      return {
        image: {
          ...state.image,
          processedDataUrl: dataUrl,
        },
      }
    })
  },

  setSelectionMode: (mode: SelectionMode) => {
    set({ selectionMode: mode })
  },

  setTolerance: (tolerance: number) => {
    set({ tolerance })
  },

  saveToHistory: (imageData: ImageData) => {
    set((state) => {
      // Truncate history if we're not at the end
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push({ imageData: new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height) })
      // Limit history to 50 entries
      if (newHistory.length > 50) {
        newHistory.shift()
      }
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
        canvasUpdateKey: state.canvasUpdateKey + 1,
      }
    })
  },

  undo: () => {
    const { historyIndex } = get()
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      set({
        historyIndex: newIndex,
        canvasUpdateKey: get().canvasUpdateKey + 1,
      })
    }
  },

  canUndo: () => {
    const { historyIndex } = get()
    return historyIndex > 0
  },

  reset: () => {
    set((state) => {
      if (!state.image) return { history: [], historyIndex: -1 }
      return {
        image: {
          ...state.image,
          processedDataUrl: state.image.originalDataUrl,
        },
        history: [],
        historyIndex: -1,
        canvasUpdateKey: state.canvasUpdateKey + 1,
        resetKey: state.resetKey + 1,
      }
    })
  },

  setZoom: (zoom: number) => {
    set({ zoom: Math.max(0.1, Math.min(5, zoom)) })
  },

  downloadImage: () => {
    const { image } = get()
    if (!image) return

    const link = document.createElement('a')
    link.download = `cutout_${image.name.replace(/\.[^/.]+$/, '')}.png`
    link.href = image.processedDataUrl
    link.click()
  },

  clearAll: () => {
    set({
      image: null,
      selectionMode: 'magicWand',
      tolerance: 30,
      history: [],
      historyIndex: -1,
      zoom: 1,
      canvasUpdateKey: 0,
      resetKey: 0,
      rectX: 0,
      rectY: 0,
      rectWidth: 100,
      rectHeight: 100,
    })
  },

  // Rectangle control methods
  setRectX: (v: number) => set({ rectX: v }),
  setRectY: (v: number) => set({ rectY: v }),
  setRectWidth: (v: number) => set({ rectWidth: v }),
  setRectHeight: (v: number) => set({ rectHeight: v }),

  setRectFromDrag: (x: number, y: number, width: number, height: number) => {
    set({
      rectX: x,
      rectY: y,
      rectWidth: width,
      rectHeight: height,
    })
  },

  applyRectCutout: () => {
    const state = get()
    if (!state.image) return

    // Create a canvas to process the image
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      const { rectX, rectY, rectWidth, rectHeight } = state

      // Make rectangle transparent
      for (let y = rectY; y < rectY + rectHeight && y < canvas.height; y++) {
        for (let x = rectX; x < rectX + rectWidth && x < canvas.width; x++) {
          if (x >= 0 && y >= 0) {
            const index = (y * canvas.width + x) * 4
            data[index + 3] = 0 // Set alpha to 0
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)
      const dataUrl = canvas.toDataURL('image/png')

      // Update state
      set((state) => {
        if (!state.image) return state

        // Create history entry
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push({
          imageData: new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
          ),
        })

        if (newHistory.length > 50) {
          newHistory.shift()
        }

        return {
          image: {
            ...state.image,
            processedDataUrl: dataUrl,
          },
          history: newHistory,
          historyIndex: newHistory.length - 1,
          canvasUpdateKey: state.canvasUpdateKey + 1,
        }
      })
    }
    img.src = state.image.processedDataUrl
  },
}))
