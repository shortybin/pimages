import { useState } from 'react'
import { useTemplateStore } from '../../store/templateStore'

export function TaskQueue() {
  const tasks = useTemplateStore((state) => state.tasks)
  const isGenerating = useTemplateStore((state) => state.isGenerating)
  const generateAll = useTemplateStore((state) => state.generateAll)
  const generateTask = useTemplateStore((state) => state.generateTask)
  const exportTask = useTemplateStore((state) => state.exportTask)

  const [previewTask, setPreviewTask] = useState<string | null>(null)

  const readyTasks = tasks.filter((t) => t.status === 'ready')

  if (tasks.length === 0) {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600">
            等待中
          </span>
        )
      case 'ready':
        return (
          <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-600">
            就绪
          </span>
        )
      case 'generating':
        return (
          <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-600 flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            生成中
          </span>
        )
      case 'done':
        return (
          <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-600">
            完成
          </span>
        )
      case 'error':
        return (
          <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-600">
            错误
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700">
          生成队列 ({tasks.length})
        </h3>
        <div className="flex items-center gap-2">
          {readyTasks.length > 0 && (
            <>
              <span className="text-xs text-slate-500">
                {readyTasks.length} 个就绪
              </span>
              {/* 一键生成按钮 */}
              <button
                onClick={generateAll}
                disabled={isGenerating}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  isGenerating
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    一键生成全部
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.folderId}
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200"
          >
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 truncate">
                  {task.folderName}
                </span>
                {getStatusBadge(task.status)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                + {task.templateName} ({task.photoCount}张照片 → {task.regionCount}个区域)
              </div>
              {task.error && (
                <div className="text-xs text-red-500 mt-0.5">{task.error}</div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {task.status === 'ready' && (
                <button
                  onClick={() => generateTask(task.folderId)}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-xs rounded bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  生成
                </button>
              )}
              {task.status === 'generating' && (
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              )}
              {task.status === 'done' && task.resultUrl && (
                <>
                  <button
                    onClick={() => setPreviewTask(task.folderId)}
                    className="px-3 py-1.5 text-xs rounded border border-slate-300 hover:bg-slate-50 text-slate-600 transition-colors"
                  >
                    预览
                  </button>
                  <button
                    onClick={() => exportTask(task.folderId)}
                    className="px-3 py-1.5 text-xs rounded border border-green-300 hover:bg-green-50 text-green-600 transition-colors"
                  >
                    下载
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewTask && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setPreviewTask(null)}
        >
          <div
            className="bg-white rounded-xl p-4 max-w-3xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-slate-700">预览</h3>
              <button
                onClick={() => setPreviewTask(null)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <svg
                  className="w-5 h-5 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <img
              src={tasks.find((t) => t.folderId === previewTask)?.resultUrl}
              alt="Preview"
              className="max-w-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
