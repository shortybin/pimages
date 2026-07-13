import type { ImageInfo } from '../types'
import { download } from '../utils/download'
import { readFileAsImage } from '../utils/imageLoader'

class FileSystemService {
  isSupported(): boolean {
    return 'showDirectoryPicker' in window
  }

  async selectDirectory(): Promise<FileSystemDirectoryHandle | null> {
    if (!this.isSupported()) {
      alert('您的浏览器不支持 File System Access API，请使用 Chrome 或 Edge 浏览器')
      return null
    }

    try {
      const handle = await window.showDirectoryPicker!({
        mode: 'read',
      })
      return handle
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error('Failed to select directory:', e)
      }
      return null
    }
  }

  async scanImages(directoryHandle: FileSystemDirectoryHandle): Promise<ImageInfo[]> {
    const images: ImageInfo[] = []

    const scanDirectory = async (handle: FileSystemDirectoryHandle, path: string = '') => {
      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile()
          if (this.isImageFile(file.name)) {
            const imageInfo = await this.createImageInfo(file)
            if (imageInfo) {
              images.push(imageInfo)
            }
          }
        } else if (entry.kind === 'directory') {
          await scanDirectory(entry, `${path}/${entry.name}`)
        }
      }
    }

    await scanDirectory(directoryHandle)
    return images
  }

  private isImageFile(filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop()
    return ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp'
  }

  private async createImageInfo(file: File): Promise<ImageInfo | null> {
    try {
      const { dataUrl, width, height } = await readFileAsImage(file)
      return {
        name: file.name,
        file,
        width,
        height,
        isHorizontal: width > height,
        dataUrl,
      }
    } catch {
      return null
    }
  }

  downloadFile(blob: Blob, filename: string): void {
    download(blob, filename)
  }

  async handleFilesFromDrop(files: FileList): Promise<ImageInfo[]> {
    const images: ImageInfo[] = []

    for (const file of Array.from(files)) {
      if (this.isImageFile(file.name)) {
        const imageInfo = await this.createImageInfo(file)
        if (imageInfo) {
          images.push(imageInfo)
        }
      }
    }

    return images
  }

  // 获取直接子文件夹列表
  async getSubDirectories(directoryHandle: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle[]> {
    const subDirs: FileSystemDirectoryHandle[] = []
    for await (const entry of directoryHandle.values()) {
      if (entry.kind === 'directory') {
        subDirs.push(entry as FileSystemDirectoryHandle)
      }
    }
    return subDirs
  }

  // 扫描单层目录的图片（不递归）
  async scanImagesFlat(directoryHandle: FileSystemDirectoryHandle): Promise<ImageInfo[]> {
    const images: ImageInfo[] = []
    for await (const entry of directoryHandle.values()) {
      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle
        const file = await fileHandle.getFile()
        if (this.isImageFile(file.name)) {
          const imageInfo = await this.createImageInfo(file)
          if (imageInfo) {
            images.push(imageInfo)
          }
        }
      }
    }
    return images
  }
}

export const fileSystemService = new FileSystemService()
