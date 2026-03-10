import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, WatermarkOptions, BackgroundOptions, ExportOptions, ToastState, ImageInfo } from '../types'
import { determineLayoutType, calculateLayouts } from '../services/layoutEngine'
import { processAndExport } from '../services/imageProcessor'
import { fileSystemService } from '../services/fileSystem'

const generateId = () => Math.random().toString(36).substring(2, 15)

interface AppState {
  projects: Project[]
  selectedProjectId: string | null
  watermark: WatermarkOptions
  background: BackgroundOptions
  exportOptions: ExportOptions
  isExporting: boolean
  exportProgress: number
  exportMessage: string
  toast: ToastState | null

  // Actions
  addProject: (name: string, images: ImageInfo[]) => void
  removeProject: (id: string) => void
  clearAllProjects: () => void
  selectProject: (id: string | null) => void
  updateWatermark: (options: Partial<WatermarkOptions>) => void
  updateBackground: (options: Partial<BackgroundOptions>) => void
  updateExportOptions: (options: Partial<ExportOptions>) => void
  exportAll: () => Promise<void>
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  hideToast: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      selectedProjectId: null,
      watermark: {
        enabled: true,
        mode: 'single',
        text: 'PhotoboothImages',
        fontSize: 24,
        color: '#FFFFFF',
        opacity: 30,
        position: 9,
        tileMode: 'diagonal',
        tileSpacing: 100,
        tileRotation: 30,
      },
      background: {
        preset: '暖米色',
      },
      exportOptions: {
        format: 'png',
        quality: 90,
      },
      isExporting: false,
      exportProgress: 0,
      exportMessage: '',
      toast: null,

      addProject: (name: string, images: ImageInfo[]) => {
        const horizontal = images.filter(i => i.isHorizontal).length
        const vertical = images.length - horizontal
        const layoutType = determineLayoutType(images)

        const project: Project = {
          id: generateId(),
          name,
          images,
          layoutType,
          total: images.length,
          horizontal,
          vertical,
          status: 'pending',
        }

        set((state) => ({
          projects: [...state.projects, project],
          selectedProjectId: project.id,
        }))
      },

      removeProject: (id: string) => {
        set((state) => {
          const newProjects = state.projects.filter((p) => p.id !== id)
          let newSelectedId = state.selectedProjectId
          if (state.selectedProjectId === id) {
            newSelectedId = newProjects.length > 0 ? newProjects[0].id : null
          }
          return { projects: newProjects, selectedProjectId: newSelectedId }
        })
      },

      clearAllProjects: () => {
        set({ projects: [], selectedProjectId: null })
      },

      selectProject: (id: string | null) => {
        set({ selectedProjectId: id })
      },

      updateWatermark: (options: Partial<WatermarkOptions>) => {
        set((state) => ({
          watermark: { ...state.watermark, ...options },
        }))
      },

      updateBackground: (options: Partial<BackgroundOptions>) => {
        set((state) => ({
          background: { ...state.background, ...options },
        }))
      },

      updateExportOptions: (options: Partial<ExportOptions>) => {
        set((state) => ({
          exportOptions: { ...state.exportOptions, ...options },
        }))
      },

      exportAll: async () => {
        const { projects, watermark, background } = get()

        if (projects.length === 0) {
          set({ toast: { message: '没有可导出的项目', type: 'error' } })
          return
        }

        set({
          isExporting: true,
          exportProgress: 0,
          exportMessage: '准备导出...',
        })

        // Reset status
        set((state) => ({
          projects: state.projects.map((p) => ({ ...p, status: 'pending' as const })),
        }))

        const completedIds: string[] = []

        for (let i = 0; i < projects.length; i++) {
          const project = projects[i]

          set((state) => ({
            projects: state.projects.map((p) =>
              p.id === project.id ? { ...p, status: 'exporting' as const } : p
            ),
            exportProgress: Math.floor(((i + 1) / projects.length) * 100),
            exportMessage: `正在处理: ${project.name} (${i + 1}/${projects.length})`,
          }))

          try {
            const { canvasWidth, canvasHeight, layouts } = calculateLayouts(project.images)
            const blob = await processAndExport(
              project.images,
              layouts,
              canvasWidth,
              canvasHeight,
              background.preset,
              watermark
            )

            // Download the file
            fileSystemService.downloadFile(blob, `${project.name}.png`)

            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === project.id ? { ...p, status: 'completed' as const } : p
              ),
            }))

            completedIds.push(project.id)
          } catch (e) {
            console.error(`Failed to export ${project.name}:`, e)
            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === project.id ? { ...p, status: 'error' as const } : p
              ),
            }))
          }

          // Small delay between exports
          await new Promise((r) => setTimeout(r, 100))
        }

        set({
          isExporting: false,
          exportProgress: 100,
          exportMessage: '导出完成!',
        })

        // Remove completed projects
        if (completedIds.length > 0) {
          set((state) => ({
            projects: state.projects.filter((p) => !completedIds.includes(p.id)),
          }))
        }

        get().showToast('导出完成!', 'success')
      },

      showToast: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        set({ toast: { message, type } })
      },

      hideToast: () => {
        set({ toast: null })
      },
    }),
    {
      name: 'pimages-storage',
      partialize: (state) => ({
        watermark: state.watermark,
        background: state.background,
        exportOptions: state.exportOptions,
      }),
    }
  )
)
