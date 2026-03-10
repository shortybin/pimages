import { create } from 'zustand'
import type {
  FrameTemplate,
  FillRegion,
  FillPhoto,
  RegionPhotoConfig,
  FrameFillStage,
} from '../types/framefill'
import {
  detectAllTransparentRegions,
  loadImage,
  getImageData,
  readFileAsImage,
  dataUrlToBlob,
} from '../services/templateProcessor'

interface FrameFillStore {
  // Core state
  stage: FrameFillStage
  template: FrameTemplate | null
  photos: FillPhoto[]
  photoConfigs: Record<string, RegionPhotoConfig>  // key: regionId
  selectedRegionId: string | null

  // Export
  resultDataUrl: string | null

  // Template actions
  setTemplate: (file: File) => Promise<void>
  setTemplateFromUrl: (url: string, name?: string) => Promise<void>
  clearTemplate: () => void

  // Photo actions
  addPhotos: (files: File[]) => Promise<void>
  removePhoto: (id: string) => void
  clearPhotos: () => void

  // Region assignment
  assignPhotoToRegion: (regionId: string, photoId: string | null) => void
  updatePhotoConfig: (regionId: string, config: Partial<RegionPhotoConfig>) => void
  selectRegion: (regionId: string | null) => void

  // Stage navigation
  setStage: (stage: FrameFillStage) => void

  // Composition
  compose: () => Promise<string>

  // Export
  export: () => void

  // Reset
  reset: () => void
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const defaultPhotoConfig: RegionPhotoConfig = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
}

const initialState = {
  stage: 'upload' as FrameFillStage,
  template: null as FrameTemplate | null,
  photos: [] as FillPhoto[],
  photoConfigs: {} as Record<string, RegionPhotoConfig>,
  selectedRegionId: null as string | null,
  resultDataUrl: null as string | null,
}

export const useFrameFillStore = create<FrameFillStore>((set, get) => ({
  ...initialState,

  // Template actions
  setTemplate: async (file: File) => {
    try {
      const { dataUrl, width, height } = await readFileAsImage(file)
      const img = await loadImage(dataUrl)
      const imageData = getImageData(img)
      const detectedRegions = detectAllTransparentRegions(imageData)

      // Convert to FillRegion format
      const regions: FillRegion[] = detectedRegions.map((r) => ({
        id: r.id,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        photoId: null,
      }))

      // Initialize photo configs for each region
      const photoConfigs: Record<string, RegionPhotoConfig> = {}
      regions.forEach((region) => {
        photoConfigs[region.id] = { ...defaultPhotoConfig }
      })

      set({
        template: {
          id: generateId(),
          name: file.name,
          dataUrl,
          width,
          height,
          regions,
        },
        photoConfigs,
        selectedRegionId: regions.length > 0 ? regions[0].id : null,
      })
    } catch (error) {
      console.error('Failed to load template:', error)
    }
  },

  setTemplateFromUrl: async (url: string, name: string = 'template.png') => {
    try {
      const img = await loadImage(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const dataUrl = canvas.toDataURL('image/png')

      const imageData = getImageData(img)
      const detectedRegions = detectAllTransparentRegions(imageData)

      // Convert to FillRegion format
      const regions: FillRegion[] = detectedRegions.map((r) => ({
        id: r.id,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        photoId: null,
      }))

      // Initialize photo configs for each region
      const photoConfigs: Record<string, RegionPhotoConfig> = {}
      regions.forEach((region) => {
        photoConfigs[region.id] = { ...defaultPhotoConfig }
      })

      set({
        template: {
          id: generateId(),
          name,
          dataUrl,
          width: img.width,
          height: img.height,
          regions,
        },
        photoConfigs,
        selectedRegionId: regions.length > 0 ? regions[0].id : null,
      })
    } catch (error) {
      console.error('Failed to load template from URL:', error)
    }
  },

  clearTemplate: () => {
    set({
      template: null,
      photoConfigs: {},
      selectedRegionId: null,
      resultDataUrl: null,
      stage: 'upload',
    })
  },

  // Photo actions
  addPhotos: async (files: File[]) => {
    try {
      const newPhotos: FillPhoto[] = []

      for (const file of files) {
        const { dataUrl, width, height } = await readFileAsImage(file)
        newPhotos.push({
          id: generateId(),
          name: file.name,
          dataUrl,
          width,
          height,
          file,
        })
      }

      set((state) => ({
        photos: [...state.photos, ...newPhotos],
      }))
    } catch (error) {
      console.error('Failed to load photos:', error)
    }
  },

  removePhoto: (id: string) => {
    set((state) => {
      // Also remove this photo from any region assignments
      const updatedRegions = state.template?.regions.map((region) =>
        region.photoId === id ? { ...region, photoId: null } : region
      )

      return {
        photos: state.photos.filter((p) => p.id !== id),
        template: state.template
          ? { ...state.template, regions: updatedRegions || [] }
          : null,
      }
    })
  },

  clearPhotos: () => {
    set((state) => ({
      photos: [],
      template: state.template
        ? {
            ...state.template,
            regions: state.template.regions.map((r) => ({ ...r, photoId: null })),
          }
        : null,
    }))
  },

  // Region assignment
  assignPhotoToRegion: (regionId: string, photoId: string | null) => {
    set((state) => {
      if (!state.template) return state

      const updatedRegions = state.template.regions.map((region) =>
        region.id === regionId ? { ...region, photoId } : region
      )

      // Reset photo config when assigning new photo
      const newPhotoConfigs = { ...state.photoConfigs }
      if (photoId) {
        newPhotoConfigs[regionId] = { ...defaultPhotoConfig }
      }

      return {
        template: { ...state.template, regions: updatedRegions },
        photoConfigs: newPhotoConfigs,
      }
    })
  },

  updatePhotoConfig: (regionId: string, config: Partial<RegionPhotoConfig>) => {
    set((state) => ({
      photoConfigs: {
        ...state.photoConfigs,
        [regionId]: { ...state.photoConfigs[regionId], ...config },
      },
    }))
  },

  selectRegion: (regionId: string | null) => {
    set({ selectedRegionId: regionId })
  },

  // Stage navigation
  setStage: (stage: FrameFillStage) => {
    set({ stage })
  },

  // Composition
  compose: async () => {
    const { template, photos, photoConfigs } = get()
    if (!template) throw new Error('No template loaded')

    const canvas = document.createElement('canvas')
    canvas.width = template.width
    canvas.height = template.height
    const ctx = canvas.getContext('2d')!

    // Load template image
    const templateImg = await loadImage(template.dataUrl)

    // Draw each photo in its assigned region
    for (const region of template.regions) {
      if (!region.photoId) continue

      const photo = photos.find((p) => p.id === region.photoId)
      if (!photo) continue

      const photoImg = await loadImage(photo.dataUrl)
      const config = photoConfigs[region.id] || defaultPhotoConfig

      ctx.save()

      // Create clipping path for this region
      ctx.beginPath()
      ctx.rect(region.x, region.y, region.width, region.height)
      ctx.clip()

      // Calculate base fit (cover mode)
      const photoRatio = photoImg.width / photoImg.height
      const regionRatio = region.width / region.height

      let baseWidth: number, baseHeight: number
      if (photoRatio > regionRatio) {
        baseHeight = region.height
        baseWidth = baseHeight * photoRatio
      } else {
        baseWidth = region.width
        baseHeight = baseWidth / photoRatio
      }

      // Apply scale and offset
      const scaledWidth = baseWidth * config.scale
      const scaledHeight = baseHeight * config.scale

      // Center position with offset
      const baseX = region.x + (region.width - baseWidth) / 2
      const baseY = region.y + (region.height - baseHeight) / 2

      const dx = baseX - (scaledWidth - baseWidth) / 2 + config.offsetX
      const dy = baseY - (scaledHeight - baseHeight) / 2 + config.offsetY

      ctx.drawImage(photoImg, dx, dy, scaledWidth, scaledHeight)
      ctx.restore()
    }

    // Draw template (top layer)
    ctx.drawImage(templateImg, 0, 0)

    const resultDataUrl = canvas.toDataURL('image/png')
    set({ resultDataUrl })
    return resultDataUrl
  },

  // Export
  export: () => {
    const { resultDataUrl, template } = get()
    if (!resultDataUrl) return

    const link = document.createElement('a')
    const safeName = template?.name.replace(/\.[^/.]+$/, '') || 'framefill'
    link.download = `${safeName}_composed.png`
    link.href = resultDataUrl
    link.click()
  },

  // Reset
  reset: () => {
    set(initialState)
  },
}))

// Helper selectors
export const getAssignedPhotoCount = (regions: FillRegion[]) => {
  return regions.filter((r) => r.photoId !== null).length
}

export const hasUnassignedRegions = (regions: FillRegion[]) => {
  return regions.some((r) => r.photoId === null)
}

export const canCompose = (template: FrameTemplate | null, photos: FillPhoto[]) => {
  if (!template || photos.length === 0) return false
  return template.regions.some((r) => r.photoId !== null)
}
