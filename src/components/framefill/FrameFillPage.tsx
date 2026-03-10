import { useEffect, useState } from 'react'
import { useFrameFillStore, canCompose } from '../../store/framefillStore'
import { TemplateUpload } from './TemplateUpload'
import { PhotoUpload } from './PhotoUpload'
import { RegionAssignPanel } from './RegionAssignPanel'
import { CompositionCanvas } from './CompositionCanvas'
import { ExportPanel } from './ExportPanel'

// Default template path
const DEFAULT_TEMPLATE_URL = '/images/2.png'

export function FrameFillPage() {
  const template = useFrameFillStore((state) => state.template)
  const photos = useFrameFillStore((state) => state.photos)
  const stage = useFrameFillStore((state) => state.stage)
  const setStage = useFrameFillStore((state) => state.setStage)
  const reset = useFrameFillStore((state) => state.reset)
  const resultDataUrl = useFrameFillStore((state) => state.resultDataUrl)
  const setTemplateFromUrl = useFrameFillStore((state) => state.setTemplateFromUrl)
  const compose = useFrameFillStore((state) => state.compose)

  const [isComposing, setIsComposing] = useState(false)

  const canProceedToEdit = template && template.regions.length > 0
  const canComposeImage = canCompose(template, photos)

  // Load default template on mount
  useEffect(() => {
    if (!template) {
      setTemplateFromUrl(DEFAULT_TEMPLATE_URL, '2.png')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto transition stages
  useEffect(() => {
    if (template && template.regions.length > 0 && stage === 'upload') {
      setStage('edit')
    }
  }, [template, stage, setStage])

  // Auto compose when entering preview stage
  useEffect(() => {
    if (stage === 'preview' && canComposeImage) {
      setIsComposing(true)
      compose().finally(() => setIsComposing(false))
    }
  }, [stage]) // eslint-disable-line react-hooks/exhaustive-deps

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
        <h1 className="text-2xl font-bold text-slate-800">镂空填充</h1>
        <p className="text-slate-500 mt-1">
          上传透明PNG模板，为每个镂空区域填充图片
        </p>
      </div>

      {/* Stage Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {(['upload', 'edit', 'preview'] as const).map((s, index) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => {
                if (s === 'edit' && !canProceedToEdit) return
                if (s === 'preview' && !canComposeImage) return
                setStage(s)
              }}
              disabled={
                (s === 'edit' && !canProceedToEdit) ||
                (s === 'preview' && !canComposeImage)
              }
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                stage === s
                  ? 'bg-indigo-500 text-white'
                  : s === 'upload' || (s === 'edit' && canProceedToEdit) || (s === 'preview' && canComposeImage)
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                stage === s ? 'bg-white/20' : 'bg-slate-200'
              }`}>
                {index + 1}
              </span>
              {s === 'upload' ? '上传' : s === 'edit' ? '编辑' : '预览'}
            </button>
            {index < 2 && (
              <div className={`w-8 h-0.5 mx-1 ${
                (s === 'upload' && canProceedToEdit) ||
                (s === 'edit' && canComposeImage)
                  ? 'bg-slate-300'
                  : 'bg-slate-200'
              }`} />
            )}
          </div>
        ))}

        {/* Reset button */}
        {(template || photos.length > 0) && (
          <button
            onClick={() => {
              if (confirm('确定要清空所有数据吗？')) {
                reset()
              }
            }}
            className="ml-auto text-sm text-red-500 hover:text-red-600"
          >
            清空重来
          </button>
        )}
      </div>

      {/* Upload Stage */}
      {stage === 'upload' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TemplateUpload />
          <PhotoUpload />
        </div>
      )}

      {/* Edit Stage */}
      {stage === 'edit' && template && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Canvas */}
          <div className="lg:col-span-2">
            <CompositionCanvas maxDisplaySize={600} />
          </div>

          {/* Right: Controls */}
          <div className="space-y-4">
            <TemplateUpload />
            <PhotoUpload />
            <RegionAssignPanel />

            {/* Preview button */}
            <button
              onClick={() => setStage('preview')}
              disabled={!canComposeImage}
              className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                canComposeImage
                  ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              预览合成结果
            </button>
          </div>
        </div>
      )}

      {/* Preview Stage */}
      {stage === 'preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Result preview */}
          <div className="lg:col-span-2">
            {isComposing ? (
              <div className="bg-white rounded-xl p-8 shadow-sm">
                <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                  <svg
                    className="w-8 h-8 animate-spin text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>正在合成...</span>
                </div>
              </div>
            ) : resultDataUrl ? (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-medium text-slate-700 mb-3">合成结果</h3>
                <div className="relative bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23e5e7eb%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23e5e7eb%22%2F%3E%3C%2Fsvg%3E')] bg-repeat rounded-lg overflow-hidden">
                  <img
                    src={resultDataUrl}
                    alt="合成结果"
                    className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-xl p-8 text-center text-slate-500">
                合成失败，请返回编辑重试
              </div>
            )}
          </div>

          {/* Right: Export */}
          <div className="space-y-4">
            <ExportPanel />

            {/* Back button */}
            <button
              onClick={() => setStage('edit')}
              className="w-full py-2 px-4 rounded-lg text-sm font-medium border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              返回编辑
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      {stage === 'upload' && !template && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">使用提示</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>1. 上传一张带透明区域的 PNG 模板图片</li>
            <li>2. 系统会自动检测所有透明镂空区域</li>
            <li>3. 上传多张填充图片</li>
            <li>4. 为每个镂空区域选择一张图片</li>
            <li>5. 在画布中拖拽调整图片位置，滚轮缩放大小</li>
            <li>6. 预览并导出最终合成图</li>
          </ul>
        </div>
      )}

      {/* Stats */}
      {template && (
        <div className="mt-6 flex gap-4 text-sm text-slate-500">
          <span>模板: {template.width} × {template.height}</span>
          <span>{template.regions.length} 个透明区域</span>
          <span>{photos.length} 张填充图片</span>
          <span>{template.regions.filter(r => r.photoId).length} 个已分配</span>
        </div>
      )}
    </div>
  )
}
