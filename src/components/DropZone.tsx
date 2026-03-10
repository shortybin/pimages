import { useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { fileSystemService } from '../services/fileSystem'
import type { ImageInfo } from '../types'

export function DropZone() {
  const addProject = useAppStore((s) => s.addProject)
  const showToast = useAppStore((s) => s.showToast)

  const handleSelectFolder = useCallback(async () => {
    const handle = await fileSystemService.selectDirectory()
    if (!handle) return

    const projects: { name: string; images: ImageInfo[] }[] = []

    // 1. 获取子文件夹
    const subDirs = await fileSystemService.getSubDirectories(handle)

    // 2. 扫描父文件夹根目录的图片
    const rootImages = await fileSystemService.scanImagesFlat(handle)
    if (rootImages.length > 0) {
      projects.push({ name: handle.name, images: rootImages })
    }

    // 3. 扫描每个子文件夹
    for (const subDir of subDirs) {
      const images = await fileSystemService.scanImagesFlat(subDir)
      if (images.length > 0) {
        projects.push({ name: subDir.name, images })
      }
    }

    if (projects.length === 0) {
      showToast('文件夹中没有找到图片', 'error')
      return
    }

    // 4. 批量创建项目
    for (const { name, images } of projects) {
      addProject(name, images)
    }

    showToast(`已添加 ${projects.length} 个项目，共 ${projects.reduce((sum, p) => sum + p.images.length, 0)} 张图片`, 'success')
  }, [addProject, showToast])

  return (
    <div className="border-2 border-dashed border-slate-200 bg-white rounded-2xl p-10 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="text-slate-400 transition-colors">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>

        <p className="text-base text-slate-700 font-medium">选择图片文件夹</p>
        <p className="text-sm text-slate-500">点击下方按钮选择包含图片的文件夹</p>

        <button
          onClick={handleSelectFolder}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all"
        >
          选择文件夹
        </button>
      </div>
    </div>
  )
}
