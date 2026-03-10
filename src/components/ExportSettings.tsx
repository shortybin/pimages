import { useAppStore } from '../store/appStore'

export function ExportSettings() {
  const isExporting = useAppStore((s) => s.isExporting)
  const exportProgress = useAppStore((s) => s.exportProgress)
  const exportMessage = useAppStore((s) => s.exportMessage)
  const projects = useAppStore((s) => s.projects)
  const exportAll = useAppStore((s) => s.exportAll)

  const canExport = projects.length > 0 && !isExporting

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4">
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
