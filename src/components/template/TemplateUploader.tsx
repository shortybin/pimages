import { useCallback } from 'react'
import { useTemplateStore } from '../../store/templateStore'

export function TemplateUploader() {
  const addTemplates = useTemplateStore((state) => state.addTemplates)

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      )
      if (files.length > 0) {
        await addTemplates(files)
      }
    },
    [addTemplates]
  )

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((file) =>
        file.type.startsWith('image/')
      )
      if (files.length > 0) {
        await addTemplates(files)
      }
      e.target.value = ''
    },
    [addTemplates]
  )

  return (
    <div
      className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-white"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => document.getElementById('template-upload')?.click()}
    >
      <input
        id="template-upload"
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-col items-center gap-2">
        <svg
          className="w-10 h-10 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <div className="text-sm text-slate-600">
          <span className="text-indigo-500 font-medium">点击或拖拽</span> 上传 PNG 模板
        </div>
        <div className="text-xs text-slate-400">支持多选，自动检测透明区域</div>
      </div>
    </div>
  )
}
