import { useFrameFillStore } from '../../store/framefillStore'

export function ExportPanel() {
  const template = useFrameFillStore((state) => state.template)
  const resultDataUrl = useFrameFillStore((state) => state.resultDataUrl)
  const exportImage = useFrameFillStore((state) => state.export)

  if (!resultDataUrl) return null

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="font-medium text-slate-700 mb-3">导出</h3>

      <div className="space-y-3">
        {/* Download button */}
        <button
          onClick={exportImage}
          className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          下载 PNG
        </button>

        {/* File info */}
        {template && (
          <div className="text-xs text-slate-500 text-center">
            {template.width} × {template.height} 像素
          </div>
        )}
      </div>
    </div>
  )
}
