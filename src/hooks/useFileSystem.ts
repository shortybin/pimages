import { useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { fileSystemService } from '../services/fileSystem'

export function useFileSystem() {
  const addProject = useAppStore((s) => s.addProject)
  const showToast = useAppStore((s) => s.showToast)

  const selectDirectory = useCallback(async () => {
    const handle = await fileSystemService.selectDirectory()
    if (!handle) return false

    const images = await fileSystemService.scanImages(handle)
    if (images.length === 0) {
      showToast('文件夹中没有找到图片', 'error')
      return false
    }

    addProject(handle.name, images)
    showToast(`已添加 ${images.length} 张图片`, 'success')
    return true
  }, [addProject, showToast])

  const handleFiles = useCallback(async (files: FileList) => {
    const images = await fileSystemService.handleFilesFromDrop(files)
    if (images.length === 0) {
      showToast('没有找到有效的图片文件', 'error')
      return false
    }

    addProject(`图片组_${Date.now()}`, images)
    showToast(`已添加 ${images.length} 张图片`, 'success')
    return true
  }, [addProject, showToast])

  return {
    selectDirectory,
    handleFiles,
    isSupported: fileSystemService.isSupported(),
  }
}
