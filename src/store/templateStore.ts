import { create } from 'zustand'
import JSZip from 'jszip'
import type {
  TemplateItem,
  PhotoFolder,
  PhotoItem,
  CompositionTask,
  TransparentRegion,
  FitMode,
} from '../types/template'
import {
  detectAllTransparentRegions,
  loadImage,
  getImageData,
  readFileAsImage,
  dataUrlToBlob,
  composeFolderWithTemplate,
} from '../services/templateProcessor'

interface TemplateStore {
  // State
  templates: TemplateItem[]
  folders: PhotoFolder[]
  tasks: CompositionTask[]
  isGenerating: boolean
  fitMode: FitMode

  // Template actions
  addTemplates: (files: File[]) => Promise<void>
  removeTemplate: (id: string) => void
  updateTemplateRegions: (id: string, regions: TransparentRegion[]) => void
  redetectTemplateRegions: (id: string) => Promise<void>

  // Folder actions
  addFolder: (files: File[], folderName?: string) => Promise<void>
  removeFolder: (id: string) => void
  setFolderTemplate: (folderId: string, templateId: string | null) => void

  // Settings
  setFitMode: (mode: FitMode) => void

  // Generation
  generateAll: () => Promise<void>
  generateTask: (folderId: string) => Promise<void>

  // Export
  exportAll: () => Promise<void>
  exportTask: (folderId: string) => void

  // Reset
  reset: () => void
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const initialState = {
  templates: [],
  folders: [],
  tasks: [],
  isGenerating: false,
  fitMode: 'cover' as FitMode,
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  ...initialState,

  // Template actions
  addTemplates: async (files: File[]) => {
    try {
      const newTemplates: TemplateItem[] = []

      for (const file of files) {
        const { dataUrl, width, height } = await readFileAsImage(file)
        const img = await loadImage(dataUrl)
        const imageData = getImageData(img)
        const regions = detectAllTransparentRegions(imageData)

        newTemplates.push({
          id: generateId(),
          name: file.name,
          dataUrl,
          width,
          height,
          regions,
        })
      }

      set((state) => ({
        templates: [...state.templates, ...newTemplates],
      }))
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  },

  removeTemplate: (id: string) => {
    set((state) => {
      // Clear folder selections that use this template
      const updatedFolders = state.folders.map((folder) =>
        folder.selectedTemplateId === id
          ? { ...folder, selectedTemplateId: null }
          : folder
      )

      // Remove tasks for this template
      const updatedTasks = state.tasks.filter((task) => task.templateId !== id)

      return {
        templates: state.templates.filter((t) => t.id !== id),
        folders: updatedFolders,
        tasks: updatedTasks,
      }
    })
  },

  updateTemplateRegions: (id: string, regions: TransparentRegion[]) => {
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, regions } : t
      ),
    }))
  },

  redetectTemplateRegions: async (id: string) => {
    const template = get().templates.find((t) => t.id === id)
    if (!template) return

    try {
      const img = await loadImage(template.dataUrl)
      const imageData = getImageData(img)
      const regions = detectAllTransparentRegions(imageData)

      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === id ? { ...t, regions } : t
        ),
      }))
    } catch (error) {
      console.error('Failed to redetect regions:', error)
    }
  },

  // Folder actions
  addFolder: async (files: File[], folderName?: string) => {
    try {
      const photos: PhotoItem[] = []

      for (const file of files) {
        const { dataUrl, width, height } = await readFileAsImage(file)
        photos.push({
          id: generateId(),
          name: file.name,
          dataUrl,
          width,
          height,
        })
      }

      const newFolder: PhotoFolder = {
        id: generateId(),
        name: folderName || `Folder ${get().folders.length + 1}`,
        photos,
        selectedTemplateId: null,
      }

      set((state) => ({
        folders: [...state.folders, newFolder],
      }))
    } catch (error) {
      console.error('Failed to load folder:', error)
    }
  },

  removeFolder: (id: string) => {
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      tasks: state.tasks.filter((t) => t.folderId !== id),
    }))
  },

  setFolderTemplate: (folderId: string, templateId: string | null) => {
    set((state) => {
      const updatedFolders = state.folders.map((folder) =>
        folder.id === folderId
          ? { ...folder, selectedTemplateId: templateId }
          : folder
      )

      // Update or create task
      const folder = updatedFolders.find((f) => f.id === folderId)
      const template = templateId
        ? state.templates.find((t) => t.id === templateId)
        : null

      let updatedTasks = state.tasks.filter((t) => t.folderId !== folderId)

      if (folder && template) {
        // Create a ready task
        const task: CompositionTask = {
          folderId: folder.id,
          templateId: template.id,
          folderName: folder.name,
          templateName: template.name,
          photoCount: folder.photos.length,
          regionCount: template.regions.length,
          status: 'ready',
        }
        updatedTasks = [...updatedTasks, task]
      }

      return {
        folders: updatedFolders,
        tasks: updatedTasks,
      }
    })
  },

  // Settings
  setFitMode: (mode: FitMode) => {
    set({ fitMode: mode })
  },

  // Generation
  generateAll: async () => {
    const { tasks, folders, templates, fitMode } = get()
    const readyTasks = tasks.filter((t) => t.status === 'ready')

    if (readyTasks.length === 0) return

    set({ isGenerating: true })

    // Process each task
    for (const task of readyTasks) {
      const folder = folders.find((f) => f.id === task.folderId)
      const template = templates.find((t) => t.id === task.templateId)

      if (!folder || !template) continue

      // Update task status to generating
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.folderId === task.folderId ? { ...t, status: 'generating' } : t
        ),
      }))

      try {
        const resultUrl = await composeFolderWithTemplate(
          template,
          folder.photos,
          fitMode
        )

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.folderId === task.folderId
              ? { ...t, status: 'done', resultUrl }
              : t
          ),
        }))
      } catch (error) {
        console.error('Failed to generate:', error)
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.folderId === task.folderId
              ? { ...t, status: 'error', error: String(error) }
              : t
          ),
        }))
      }
    }

    set({ isGenerating: false })
  },

  generateTask: async (folderId: string) => {
    const { folders, templates, fitMode } = get()

    const folder = folders.find((f) => f.id === folderId)
    const template = folder?.selectedTemplateId
      ? templates.find((t) => t.id === folder.selectedTemplateId)
      : null

    if (!folder || !template) return

    set({ isGenerating: true })

    // Update task status
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.folderId === folderId ? { ...t, status: 'generating' } : t
      ),
    }))

    try {
      const resultUrl = await composeFolderWithTemplate(
        template,
        folder.photos,
        fitMode
      )

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.folderId === folderId
            ? { ...t, status: 'done', resultUrl }
            : t
        ),
      }))
    } catch (error) {
      console.error('Failed to generate:', error)
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.folderId === folderId
            ? { ...t, status: 'error', error: String(error) }
            : t
        ),
      }))
    }

    set({ isGenerating: false })
  },

  // Export
  exportAll: async () => {
    const { tasks } = get()
    const doneTasks = tasks.filter((t) => t.status === 'done' && t.resultUrl)

    if (doneTasks.length === 0) return

    const zip = new JSZip()

    for (const task of doneTasks) {
      if (!task.resultUrl) continue
      const blob = dataUrlToBlob(task.resultUrl)
      const safeName = task.folderName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
      zip.file(`${safeName}.png`, blob)
    }

    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)

    const link = document.createElement('a')
    link.download = `composites_${Date.now()}.zip`
    link.href = url
    link.click()

    URL.revokeObjectURL(url)
  },

  exportTask: (folderId: string) => {
    const task = get().tasks.find((t) => t.folderId === folderId)
    if (!task?.resultUrl) return

    const link = document.createElement('a')
    const safeName = task.folderName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
    link.download = `${safeName}.png`
    link.href = task.resultUrl
    link.click()
  },

  // Reset
  reset: () => {
    set(initialState)
  },
}))

// Selector to get templates matching a specific photo count
// Returns templates where region count <= photo count (photos must be enough to fill all regions)
export const getMatchingTemplates = (photoCount: number, templates: TemplateItem[]) => {
  return templates.filter((t) => t.regions.length <= photoCount)
}

// Selector to check if all tasks are ready
export const canGenerateAll = (tasks: CompositionTask[]) => {
  return tasks.some((t) => t.status === 'ready')
}

// Selector to check if there are completed tasks
export const hasCompletedTasks = (tasks: CompositionTask[]) => {
  return tasks.some((t) => t.status === 'done')
}
