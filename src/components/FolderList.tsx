import { useAppStore } from '../store/appStore'

function getStatusClass(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700'
    case 'exporting':
      return 'bg-yellow-100 text-yellow-700'
    case 'error':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'exporting':
      return '处理中'
    case 'error':
      return '失败'
    default:
      return '待处理'
  }
}

export function FolderList() {
  const projects = useAppStore((s) => s.projects)
  const removeProject = useAppStore((s) => s.removeProject)
  const clearAllProjects = useAppStore((s) => s.clearAllProjects)
  const isExporting = useAppStore((s) => s.isExporting)

  const handleClearAll = () => {
    if (projects.length === 0) return
    if (confirm('确定要清空所有已选择的项目吗？')) {
      clearAllProjects()
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <span className="text-sm font-medium text-slate-700">已选项目 ({projects.length})</span>
        {projects.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={isExporting}
            className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            清空所有
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="py-10 text-center text-slate-500">还没有添加项目</div>
      ) : (
        <div className="max-h-[300px] overflow-y-auto">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-400 font-mono">{String(index + 1).padStart(3, '0')}</span>
                  <span className="text-sm font-medium text-slate-800 truncate">{project.name}</span>
                </div>
                <div className="flex items-center gap-3 pl-8">
                  <span className="text-xs text-slate-500">{project.total}张</span>
                  <span className="text-xs text-slate-500">{project.horizontal}横+{project.vertical}竖</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusClass(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeProject(project.id)}
                disabled={isExporting}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
