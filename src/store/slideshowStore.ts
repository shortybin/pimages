import { create } from 'zustand'
import type { SlideshowImage, SlideshowSettings, SlideshowAudio, AudioSettings } from '../types/slideshow'
import { defaultSettings } from '../types/slideshow'

const generateId = () => Math.random().toString(36).substring(2, 15)

// 获取音频时长
const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.src = URL.createObjectURL(file)
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(audio.src)
      resolve(audio.duration)
    })
    audio.addEventListener('error', () => {
      resolve(0)
    })
  })
}

interface SlideshowState {
  images: SlideshowImage[]
  settings: SlideshowSettings
  isPlaying: boolean
  isPaused: boolean
  currentIndex: number

  // 音频状态
  audioTracks: SlideshowAudio[]
  currentAudioIndex: number

  // Actions
  setImages: (images: SlideshowImage[]) => void
  addImages: (files: File[], nameFilter?: string[]) => void
  removeImage: (id: string) => void
  clearImages: () => void
  setSettings: (settings: Partial<SlideshowSettings>) => void
  play: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  next: () => void
  prev: () => void
  goTo: (index: number) => void

  // 音频 Actions
  addAudioTracks: (files: File[]) => Promise<void>
  removeAudioTrack: (id: string) => void
  clearAudioTracks: () => void
  setAudioSettings: (settings: Partial<AudioSettings>) => void
  nextAudio: () => void
  setCurrentAudioIndex: (index: number) => void
}

export const useSlideshowStore = create<SlideshowState>((set, get) => ({
  images: [],
  settings: defaultSettings,
  isPlaying: false,
  isPaused: false,
  currentIndex: 0,
  audioTracks: [],
  currentAudioIndex: 0,

  setImages: (images: SlideshowImage[]) => {
    set({ images })
  },

  addImages: (files: File[], nameFilter?: string[]) => {
    const newImages: SlideshowImage[] = []

    for (const file of files) {
      // 检查是否是图片
      const isImage = file.type.startsWith('image/')
      if (!isImage) continue

      // 如果有名称过滤，检查是否匹配
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

    // 如果开启随机顺序，打乱数组
    const { shuffle } = get().settings
    const finalImages = shuffle ? shuffleArray(newImages) : newImages

    set((state) => ({
      images: [...state.images, ...finalImages],
    }))
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
    set({ images: [], currentIndex: 0, isPlaying: false, isPaused: false })
  },

  setSettings: (newSettings: Partial<SlideshowSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }))
  },

  play: () => {
    const { images } = get()
    if (images.length === 0) return

    // 如果开启随机顺序，打乱图片
    const { shuffle } = get().settings
    if (shuffle) {
      set({
        images: shuffleArray([...images]),
        currentIndex: 0,
        isPlaying: true,
        isPaused: false,
      })
    } else {
      set({ isPlaying: true, isPaused: false, currentIndex: 0 })
    }
  },

  pause: () => {
    set({ isPaused: true })
  },

  resume: () => {
    set({ isPaused: false })
  },

  stop: () => {
    set({ isPlaying: false, isPaused: false, currentIndex: 0, currentAudioIndex: 0 })
  },

  next: () => {
    const { images, currentIndex, settings } = get()
    if (images.length === 0) return

    let nextIndex = currentIndex + 1

    if (nextIndex >= images.length) {
      if (settings.loop) {
        nextIndex = 0
      } else {
        // 到达末尾且不循环，停止播放
        set({ isPlaying: false, isPaused: false })
        return
      }
    }

    set({ currentIndex: nextIndex })
  },

  prev: () => {
    const { images, currentIndex, settings } = get()
    if (images.length === 0) return

    let prevIndex = currentIndex - 1

    if (prevIndex < 0) {
      if (settings.loop) {
        prevIndex = images.length - 1
      } else {
        prevIndex = 0
      }
    }

    set({ currentIndex: prevIndex })
  },

  goTo: (index: number) => {
    const { images } = get()
    if (index < 0 || index >= images.length) return
    set({ currentIndex: index })
  },

  // 音频 Actions
  addAudioTracks: async (files: File[]) => {
    const newTracks: SlideshowAudio[] = []

    for (const file of files) {
      const isAudio = file.type.startsWith('audio/') ||
        ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac']
          .some(type => file.type.includes(type.replace('audio/', '')))

      if (!isAudio && !/\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name)) continue

      const duration = await getAudioDuration(file)

      newTracks.push({
        id: generateId(),
        name: file.name,
        url: URL.createObjectURL(file),
        originalFile: file,
        duration,
      })
    }

    set((state) => ({
      audioTracks: [...state.audioTracks, ...newTracks],
    }))
  },

  removeAudioTrack: (id: string) => {
    set((state) => {
      const track = state.audioTracks.find(t => t.id === id)
      if (track) {
        URL.revokeObjectURL(track.url)
      }
      const newTracks = state.audioTracks.filter(t => t.id !== id)
      const newIndex = state.currentAudioIndex >= newTracks.length
        ? Math.max(0, newTracks.length - 1)
        : state.currentAudioIndex
      return {
        audioTracks: newTracks,
        currentAudioIndex: newIndex,
      }
    })
  },

  clearAudioTracks: () => {
    const { audioTracks } = get()
    audioTracks.forEach(track => URL.revokeObjectURL(track.url))
    set({ audioTracks: [], currentAudioIndex: 0 })
  },

  setAudioSettings: (newSettings: Partial<AudioSettings>) => {
    set((state) => ({
      settings: {
        ...state.settings,
        audio: { ...state.settings.audio, ...newSettings },
      },
    }))
  },

  nextAudio: () => {
    const { audioTracks, currentAudioIndex, settings } = get()
    if (audioTracks.length === 0) return

    let nextIndex = currentAudioIndex + 1

    if (nextIndex >= audioTracks.length) {
      if (settings.audio.loop) {
        nextIndex = 0
      } else {
        return
      }
    }

    set({ currentAudioIndex: nextIndex })
  },

  setCurrentAudioIndex: (index: number) => {
    const { audioTracks } = get()
    if (index < 0 || index >= audioTracks.length) return
    set({ currentAudioIndex: index })
  },
}))

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}
