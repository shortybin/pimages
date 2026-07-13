import { useAppStore } from '../store/appStore'

export function ExportSettings() {
  const isExporting = useAppStore((s) => s.isExporting)
  const exportProgress = useAppStore((s) => s.exportProgress)
  const exportMessage = useAppStore((s) => s.exportMessage)
  const projects = useAppStore((s) => s.projects)
  const exportAll = useAppStore((s) => s.exportAll)
  const exportOptions = useAppStore((s) => s.exportOptions)
  const updateExportOptions = useAppStore((s) => s.updateExportOptions)

  const canExport = projects.length > 0 && !isExporting
  const isJpeg = exportOptions.format === 'jpeg'

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 space-y-4">
        {/* 导出格式 */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">导出格式</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateExportOptions({ format: 'png' })}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                !isJpeg
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              PNG
            </button>
            <button
              onClick={() => updateExportOptions({ format: 'jpeg' })}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                isJpeg
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              JPEG
            </button>
          </div>
        </div>

        {/* 质量：仅 JPEG 生效 */}
        <div className={isJpeg ? '' : 'opacity-40 pointer-events-none'}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-600">质量</label>
            <span className="text-xs text-slate-500 tabular-nums">{exportOptions.quality}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={exportOptions.quality}
            onChange={(e) => updateExportOptions({ quality: Number(e.target.value) })}
            disabled={!isJpeg}
            className="w-full accent-indigo-500"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            {isJpeg ? '数值越低文件越小，画质越低' : 'PNG 为无损格式，不支持质量调节'}
          </p>
        </div>

        <button
          onClick={exportAll}
          disabled={!canExport}
          className={`
            w-full py-3 rounded-xl font-semibold text-white transition-all
            ${canExport
              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5'
              : 'bg-slate-300 cursor-not-allowed'
            }
          `}
        >
          {isExporting ? `导出中... ${exportProgress}%` : `导出全部 (${projects.length}个项目)`}
        </button>

        {isExporting && (
          <div className="mt-3">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-600 text-center">{exportMessage}</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
        <p className="text-xs text-slate-500 text-center">
          导出的图片将自动下载到您的下载文件夹
        </p>
      </div>
    </div>
  )
}
