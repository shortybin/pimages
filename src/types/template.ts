/**
 * Transparent region in a template
 */
export interface TransparentRegion {
  id: string
  x: number
  y: number
  width: number
  height: number
}

/**
 * Single photo item
 */
export interface PhotoItem {
  id: string
  name: string
  dataUrl: string
  width: number
  height: number
}

/**
 * Template item with detected regions
 */
export interface TemplateItem {
  id: string
  name: string
  dataUrl: string
  width: number
  height: number
  regions: TransparentRegion[]
}

/**
 * Photo folder with photos and selected template
 */
export interface PhotoFolder {
  id: string
  name: string
  photos: PhotoItem[]
  selectedTemplateId: string | null
}

/**
 * Composition task for generation queue
 */
export interface CompositionTask {
  folderId: string
  templateId: string
  folderName: string
  templateName: string
  photoCount: number
  regionCount: number
  status: 'pending' | 'ready' | 'generating' | 'done' | 'error'
  resultUrl?: string
  error?: string
}

/**
 * Fit mode for photo placement
 */
export type FitMode = 'cover' | 'contain'

/**
 * Template store state
 */
export interface TemplateState {
  // Multiple templates
  templates: TemplateItem[]

  // Photo folders
  folders: PhotoFolder[]

  // Generation tasks
  tasks: CompositionTask[]

  // Processing state
  isGenerating: boolean

  // Settings
  fitMode: FitMode
}

// Legacy types for backwards compatibility (can be removed after migration)
export interface CompositeResult {
  photoId: string
  compositeUrl: string
}
