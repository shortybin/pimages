import { useState, useEffect } from 'react'
import { useTemplateStore, getMatchingTemplates } from '../../store/templateStore'

export function FolderList() {
  const folders = useTemplateStore((state) => state.folders)
  const templates = useTemplateStore((state) => state.templates)
  const removeFolder = useTemplateStore((state) => state.removeFolder)
  const setFolderTemplate = useTemplateStore((state) => state.setFolderTemplate)

  // 使用 Set 管理展开状态，默认全部展开
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // 当有新文件夹添加时，自动展开
  useEffect(() => {
    const currentIds = new Set(folders.map(f => f.id))
    const newIds = [...currentIds].filter(id => !expandedFolders.has(id))
    if (newIds.length > 0) {
      setExpandedFolders(prev => {
        const newSet = new Set(prev)
        newIds.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }, [folders])

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  if (folders.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h3 className="text-sm font-medium text-slate-700 mb-3">
        文件夹列表 ({folders.length})
      </h3>
      <div className="space-y-2">
        {folders.map((folder) => {
          const matchingTemplates = getMatchingTemplates(
            folder.photos.length,
            templates
          )
          const hasMatch = matchingTemplates.length > 0
          const isExpanded = expandedFolders.has(folder.id)

          return (
            <div
              key={folder.id}
              className="rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden"
            >
              {/* Folder header row */}
              <div className="flex items-center gap-3 p-3">
                {/* Expand button */}
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="flex-shrink-0 w-8 h-8 rounded bg-amber-100 flex items-center justify-center hover:bg-amber-200 transition-colors"
                  title={isExpanded ? '收起' : '展开查看图片'}
                >
                  <svg
                    className={`w-5 h-5 text-amber-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </button>

                {/* Folder info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700 truncate">
                    {folder.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {folder.photos.length} 张照片
                  </div>
                </div>

                {/* Template selector */}
                <select
                  value={folder.selectedTemplateId || ''}
                  onChange={(e) =>
                    setFolderTemplate(folder.id, e.target.value || null)
                  }
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={!hasMatch}
                >
                  <option value="">
                    {hasMatch ? '选择模板...' : '无匹配模板'}
                  </option>
                  {matchingTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.regions.length} 区域)
                    </option>
                  ))}
                </select>

                {/* Remove button */}
                <button
                  onClick={() => removeFolder(folder.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  title="删除文件夹"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Expanded photo grid */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-100">
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 mt-3">
                    {folder.photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group"
                        title={`${index + 1}. ${photo.name}`}
                      >
                        <img
                          src={photo.dataUrl}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Photo index badge */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent py-0.5 px-1">
                          <span className="text-[10px] text-white font-medium">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="mt-3 text-xs text-slate-400">
        提示: 点击文件夹图标展开查看图片，下拉菜单只显示区域数量 ≤ 照片数量的模板
      </div>
    </div>
  )
}
