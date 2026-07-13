import { useEffect } from 'react'
import { useTemplateStore, canGenerateAll, hasCompletedTasks } from '../../store/templateStore'
import { TemplateUploader } from './TemplateUploader'
import { FolderUploader } from './FolderUploader'
import { TemplateList } from './TemplateList'
import { FolderList } from './FolderList'
import { TaskQueue } from './TaskQueue'

export function TemplateComposer() {
  const templates = useTemplateStore((state) => state.templates)
  const folders = useTemplateStore((state) => state.folders)
  const tasks = useTemplateStore((state) => state.tasks)
  const fitMode = useTemplateStore((state) => state.fitMode)
  const isGenerating = useTemplateStore((state) => state.isGenerating)
  const setFitMode = useTemplateStore((state) => state.setFitMode)
  const generateAll = useTemplateStore((state) => state.generateAll)
  const exportAll = useTemplateStore((state) => state.exportAll)
  const reset = useTemplateStore((state) => state.reset)

  const hasReady = canGenerateAll(tasks)
  const hasCompleted = hasCompletedTasks(tasks)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">模板合成</h1>
        <p className="text-slate-500 mt-1">
          多模板 + 文件夹配对 + 一键生成
        </p>
      </div>

      {/* Top Toolbar */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          {/* Template Upload */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files || [])
                if (files.length > 0) {
                  const { addTemplates } = useTemplateStore.getState()
                  await addTemplates(files)
                }
                e.target.value = ''
              }}
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              上传模板
            </span>
          </label>

          {/* Folder Upload */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              webkitdirectory=""
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))
                if (files.length > 0) {
                  const { addFolder } = useTemplateStore.getState()

                  // Group files by subfolder (second level directory)
                  // "Parent/folder_A/photo1.jpg" → "folder_A"
                  // "folder/photo1.jpg" → "folder"
                  const folderMap = new Map<string, File[]>()
                  const getFolderName = (pathParts: string[]) => {
                    if (pathParts.length > 2) return pathParts[1]
                    if (pathParts.length > 1) return pathParts[0]
                    return 'Root'
                  }
                  for (const file of files) {
                    const pathParts = file.webkitRelativePath.split('/')
                    const folderName = getFolderName(pathParts)
                    if (!folderMap.has(folderName)) {
                      folderMap.set(folderName, [])
                    }
                    folderMap.get(folderName)!.push(file)
                  }

                  // Add each folder as a separate entry
                  for (const [folderName, folderFiles] of folderMap) {
                    folderFiles.sort((a, b) => a.name.localeCompare(b.name))
                    await addFolder(folderFiles, folderName)
                  }
                }
                e.target.value = ''
              }}
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              选择父目录
            </span>
          </label>

          {/* Fit Mode */}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
            <span className="text-sm text-slate-500">适配模式:</span>
            <button
              onClick={() => setFitMode('cover')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                fitMode === 'cover'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cover
            </button>
            <button
              onClick={() => setFitMode('contain')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                fitMode === 'contain'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Contain
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Generate All */}
          <button
            onClick={generateAll}
            disabled={!hasReady || isGenerating}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasReady && !isGenerating
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                一键生成
              </>
            )}
          </button>

          {/* Export All */}
          <button
            onClick={exportAll}
            disabled={!hasCompleted}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasCompleted
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载 ZIP
          </button>

          {/* Clear All */}
          <button
            onClick={() => {
              if (confirm('确定要清空所有数据吗？')) {
                reset()
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 border border-red-300 text-red-600 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            清空
          </button>
        </div>
      </div>

      {/* Main Content */}
      {templates.length === 0 && folders.length === 0 ? (
        /* Empty State */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateUploader />
          <FolderUploader />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Template List */}
          <TemplateList />

          {/* Folder List */}
          <FolderList />

          {/* Task Queue */}
          <TaskQueue />
        </div>
      )}

      {/* Tips */}
      {templates.length === 0 && folders.length === 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">使用提示</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>1. 上传多个带透明区域的 PNG 模板，系统自动检测透明区域</li>
            <li>2. 选择包含子文件夹的父目录，每个子文件夹会被识别为独立项目</li>
            <li>3. 每个文件夹通过下拉菜单选择对应模板（只显示区域数量 ≤ 照片数量的模板）</li>
            <li>4. 点击"一键生成"，批量生成所有合成图</li>
            <li>5. 下载 ZIP 文件获取所有合成结果</li>
          </ul>
        </div>
      )}

      {/* Stats */}
      {(templates.length > 0 || folders.length > 0) && (
        <div className="mt-6 flex gap-4 text-sm text-slate-500">
          <span>{templates.length} 个模板</span>
          <span>{folders.length} 个文件夹</span>
          <span>{tasks.filter((t) => t.status === 'ready').length} 个就绪</span>
          <span>{tasks.filter((t) => t.status === 'done').length} 个完成</span>
        </div>
      )}
    </div>
  )
}
