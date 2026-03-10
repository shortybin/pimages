import { useCallback, useState } from 'react'
import { useCutoutStore } from '../../store/cutoutStore'

export function ImageUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const setImage = useCutoutStore((state) => state.setImage)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('请上传图片文件')
        return
      }
      await setImage(file)
    },
    [setImage]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative w-full max-w-xl aspect-video border-2 border-dashed rounded-2xl
                    flex flex-col items-center justify-center gap-4 p-8
                    transition-all duration-300 cursor-pointer
                    ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                    }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center
                      ${isDragging ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}
                      transition-colors duration-300`}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-lg font-medium text-slate-700">
            {isDragging ? '松开鼠标上传图片' : '拖拽图片到这里'}
          </p>
          <p className="text-sm text-slate-500 mt-1">或点击选择文件</p>
        </div>

        <p className="text-xs text-slate-400">支持 JPG、PNG、WebP 格式</p>
      </div>
    </div>
  )
}
