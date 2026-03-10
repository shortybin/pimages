import { useCallback } from 'react'
import { useFrameFillStore } from '../../store/framefillStore'

export function TemplateUpload() {
  const setTemplate = useFrameFillStore((state) => state.setTemplate)
  const template = useFrameFillStore((state) => state.template)

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      )
      if (files.length > 0) {
        await setTemplate(files[0])
      }
    },
    [setTemplate]
  )

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((file) =>
        file.type.startsWith('image/')
      )
      if (files.length > 0) {
        await setTemplate(files[0])
      }
      e.target.value = ''
    },
    [setTemplate]
  )

  if (template) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-slate-700">模板图片</h3>
          <button
            onClick={() => {
              const input = document.getElementById('template-upload-replace') as HTMLInputElement
              input?.click()
            }}
            className="text-sm text-indigo-500 hover:text-indigo-600"
          >
            更换
          </button>
          <input
            id="template-upload-replace"
            type="file"
            accept="image/png"
            className="hidden"
            onChange={handleChange}
          />
        </div>
        <div className="relative aspect-square bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23e5e7eb%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23e5e7eb%22%2F%3E%3C%2Fsvg%3E')] bg-repeat rounded-lg overflow-hidden">
          <img
            src={template.dataUrl}
            alt={template.name}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="mt-2 text-xs text-slate-500 text-center">
          {template.width} × {template.height} · {template.regions.length} 个透明区域
        </div>
      </div>
    )
  }

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
        accept="image/png"
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
        <div className="text-xs text-slate-400">透明 PNG 图片，自动检测镂空区域</div>
      </div>
    </div>
  )
}
