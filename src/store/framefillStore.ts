import { create } from 'zustand'
import type {
  FrameTemplate,
  FillRegion,
  FillPhoto,
  RegionPhotoConfig,
  FrameFillStage,
} from '../types/framefill'
import { detectAllTransparentRegions } from '../services/templateProcessor'
import { loadImage, getImageData, readFileAsImage } from '../utils/imageLoader'
import { calculatePhotoPlacement, calculateCoverScale } from '../services/photoPlacement'
import { generateId } from '../utils/id'
import { download } from '../utils/download'

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

 // Sync: copy first region's config to all other assigned regions
 syncFromFirstRegion: () => void

 // Stage navigation
 setStage: (stage: FrameFillStage) => void

  // Composition
  compose: () => Promise<string>

  // Export
  export: () => void

  // Reset
  reset: () => void
}


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

      // 分配新照片时，算出刚好 cover 区域的初始 scale，保证默认能看到主体
      const newPhotoConfigs = { ...state.photoConfigs }
      if (photoId) {
        const region = state.template.regions.find((r) => r.id === regionId)
        const photo = state.photos.find((p) => p.id === photoId)
        const initScale = region && photo
          ? calculateCoverScale(region, photo.width, photo.height)
          : 1
        newPhotoConfigs[regionId] = { offsetX: 0, offsetY: 0, scale: initScale }
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

 // 将第一个区域的 scale/offset 复制到其他已分配照片的区域
 syncFromFirstRegion: () => {
   const { template, photoConfigs, photos } = get()
   if (!template || template.regions.length === 0) return

   const firstRegion = template.regions[0]
   const firstConfig = photoConfigs[firstRegion.id]
   if (!firstConfig || !firstRegion.photoId) return

   const newPhotoConfigs = { ...photoConfigs }
   for (const region of template.regions) {
     if (region.id === firstRegion.id || !region.photoId) continue

     const photo = photos.find((p) => p.id === region.photoId)
     if (!photo) continue

     // clamp 到目标区域的有效范围，防止缩放超出 cover 或上限
     const minScale = calculateCoverScale(region, photo.width, photo.height)
     const maxScale = minScale * 5
     const scale = Math.max(minScale, Math.min(maxScale, firstConfig.scale))

     newPhotoConfigs[region.id] = {
       offsetX: firstConfig.offsetX,
       offsetY: firstConfig.offsetY,
       scale,
     }
   }

   set({ photoConfigs: newPhotoConfigs })
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

      // 复用与预览一致的位置计算（cover + 等比缩放）
      const { dx, dy, dw, dh } = calculatePhotoPlacement(
        region,
        photoImg.width,
        photoImg.height,
        config
      )

      ctx.drawImage(photoImg, dx, dy, dw, dh)
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

    const safeName = template?.name.replace(/\.[^/.]+$/, '') || 'framefill'
    download(resultDataUrl, `${safeName}_composed.png`)
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
