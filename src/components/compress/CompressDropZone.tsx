import { useState, useRef } from 'react'
import { useCompressStore } from '../../store/compressStore'

export function CompressDropZone() {
  const [isDragging, setIsDragging] = useState(false)
  const addImages = useCompressStore((state) => state.addImages)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length > 0) {
      await addImages(fileArray)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    processFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
    // 重置 input value，确保可以重复选择
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative border-2 border-dashed rounded-xl
                  flex flex-col items-center justify-center gap-3 p-8
                  transition-all duration-300 cursor-pointer
                  ${
                    isDragging
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                  }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center
                    ${
                      isDragging
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-slate-200 text-slate-500'
                    }
                    transition-colors duration-300`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-base font-medium text-slate-700">
          {isDragging ? '松开鼠标添加图片' : '拖拽图片到这里，或点击选择'}
        </p>
        <p className="text-sm text-slate-500 mt-1">支持批量上传 JPG、PNG、WebP 格式</p>
      </div>
    </div>
  )
}
