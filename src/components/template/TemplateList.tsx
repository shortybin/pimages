import { useState } from 'react'
import { useTemplateStore } from '../../store/templateStore'
import { TemplateEditor } from './TemplateEditor'
import type { TemplateItem } from '../../types/template'

interface TemplateCardProps {
  template: TemplateItem
  onEdit: () => void
}

function TemplateCard({ template, onEdit }: TemplateCardProps) {
  const removeTemplate = useTemplateStore((state) => state.removeTemplate)

  // Calculate display size
  const maxSize = 120
  const scale =
    template.width > template.height
      ? maxSize / template.width
      : maxSize / template.height
  const displayWidth = template.width * scale
  const displayHeight = template.height * scale

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 hover:border-indigo-300 transition-colors">
      <div className="flex items-start gap-3">
        {/* Preview */}
        <div
          className="rounded overflow-hidden flex-shrink-0"
          style={{
            width: displayWidth,
            height: displayHeight,
            background:
              'repeating-conic-gradient(#cbd5e1 0% 25%, white 0% 50%) 50% / 8px 8px',
          }}
        >
          <img
            src={template.dataUrl}
            alt={template.name}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-700 truncate">
            {template.name}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {template.regions.length} 个区域
          </div>
          <div className="text-xs text-slate-400">
            {template.width} × {template.height}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={onEdit}
          className="flex-1 px-2 py-1.5 text-xs rounded border border-slate-300 hover:bg-slate-50 text-slate-600 transition-colors"
        >
          编辑区域
        </button>
        <button
          onClick={() => removeTemplate(template.id)}
          className="px-2 py-1.5 text-xs rounded border border-red-300 hover:bg-red-50 text-red-600 transition-colors"
        >
          删除
        </button>
      </div>
    </div>
  )
}

export function TemplateList() {
  const templates = useTemplateStore((state) => state.templates)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)

  const editingTemplate = templates.find((t) => t.id === editingTemplateId)

  if (templates.length === 0) {
    return null
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">
          模板列表 ({templates.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => setEditingTemplateId(template.id)}
            />
          ))}
        </div>
      </div>

      {/* Editor Modal */}
      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => setEditingTemplateId(null)}
        />
      )}
    </>
  )
}
