import { useState, useRef, useCallback } from 'react'
import { useTemplateStore } from '../../store/templateStore'
import type { TemplateItem, TransparentRegion } from '../../types/template'

type DragType = 'move' |
  'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' |
  'resize-n' | 'resize-s' | 'resize-w' | 'resize-e'

interface DragState {
  regionId: string
  dragType: DragType
  startX: number
  startY: number
  startRegion: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface TemplateEditorProps {
  template: TemplateItem
  onClose: () => void
}

export function TemplateEditor({ template, onClose }: TemplateEditorProps) {
  const updateTemplateRegions = useTemplateStore((state) => state.updateTemplateRegions)
  const redetectTemplateRegions = useTemplateStore((state) => state.redetectTemplateRegions)

  const [regions, setRegions] = useState<TransparentRegion[]>(template.regions)
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null)
  const [drawingCurrent, setDrawingCurrent] = useState<{ x: number; y: number } | null>(null)
  const [isAddingRegion, setIsAddingRegion] = useState(false)
  const [dragState, setDragState] = useState<DragState | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate display size (max 500px)
  const maxSize = 500
  const scale =
    template.width > template.height
      ? maxSize / template.width
      : maxSize / template.height
  const displayWidth = template.width * scale
  const displayHeight = template.height * scale

  // Convert screen coordinates to template coordinates
  const screenToTemplate = useCallback((screenX: number, screenY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 }

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.round((screenX - rect.left) / scale)
    const y = Math.round((screenY - rect.top) / scale)

    return {
      x: Math.max(0, Math.min(template.width, x)),
      y: Math.max(0, Math.min(template.height, y)),
    }
  }, [scale, template.width, template.height])

  // Handle mouse down for drawing new region
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!isAddingRegion) return

    e.stopPropagation()
    const { x, y } = screenToTemplate(e.clientX, e.clientY)
    setIsDrawing(true)
    setDrawingStart({ x, y })
    setDrawingCurrent({ x, y })
  }

  // Handle mouse move for drawing or dragging
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDrawing) {
      const { x, y } = screenToTemplate(e.clientX, e.clientY)
      setDrawingCurrent({ x, y })
    } else if (dragState) {
      const { x, y } = screenToTemplate(e.clientX, e.clientY)
      const deltaX = x - dragState.startX
      const deltaY = y - dragState.startY

      const { startRegion, dragType } = dragState
      const newRegion = { ...startRegion }

      switch (dragType) {
        case 'move':
          newRegion.x = Math.max(0, Math.min(template.width - startRegion.width, startRegion.x + deltaX))
          newRegion.y = Math.max(0, Math.min(template.height - startRegion.height, startRegion.y + deltaY))
          break
        case 'resize-nw':
          newRegion.x = Math.max(0, Math.min(startRegion.x + startRegion.width - 20, startRegion.x + deltaX))
          newRegion.y = Math.max(0, Math.min(startRegion.y + startRegion.height - 20, startRegion.y + deltaY))
          newRegion.width = startRegion.width - (newRegion.x - startRegion.x)
          newRegion.height = startRegion.height - (newRegion.y - startRegion.y)
          break
        case 'resize-ne':
          newRegion.y = Math.max(0, Math.min(startRegion.y + startRegion.height - 20, startRegion.y + deltaY))
          newRegion.width = Math.max(20, Math.min(template.width - startRegion.x, startRegion.width + deltaX))
          newRegion.height = startRegion.height - (newRegion.y - startRegion.y)
          break
        case 'resize-sw':
          newRegion.x = Math.max(0, Math.min(startRegion.x + startRegion.width - 20, startRegion.x + deltaX))
          newRegion.width = startRegion.width - (newRegion.x - startRegion.x)
          newRegion.height = Math.max(20, Math.min(template.height - startRegion.y, startRegion.height + deltaY))
          break
        case 'resize-se':
          newRegion.width = Math.max(20, Math.min(template.width - startRegion.x, startRegion.width + deltaX))
          newRegion.height = Math.max(20, Math.min(template.height - startRegion.y, startRegion.height + deltaY))
          break
        case 'resize-n':
          newRegion.y = Math.max(0, Math.min(startRegion.y + startRegion.height - 20, startRegion.y + deltaY))
          newRegion.height = startRegion.height - (newRegion.y - startRegion.y)
          break
        case 'resize-s':
          newRegion.height = Math.max(20, Math.min(template.height - startRegion.y, startRegion.height + deltaY))
          break
        case 'resize-w':
          newRegion.x = Math.max(0, Math.min(startRegion.x + startRegion.width - 20, startRegion.x + deltaX))
          newRegion.width = startRegion.width - (newRegion.x - startRegion.x)
          break
        case 'resize-e':
          newRegion.width = Math.max(20, Math.min(template.width - startRegion.x, startRegion.width + deltaX))
          break
      }

      setRegions((prev) =>
        prev.map((r) => (r.id === dragState.regionId ? { ...r, ...newRegion } : r))
      )
    }
  }

  // Handle mouse up for finishing drawing
  const handleCanvasMouseUp = () => {
    if (isDrawing && drawingStart && drawingCurrent) {
      const x = Math.min(drawingStart.x, drawingCurrent.x)
      const y = Math.min(drawingStart.y, drawingCurrent.y)
      const width = Math.abs(drawingCurrent.x - drawingStart.x)
      const height = Math.abs(drawingCurrent.y - drawingStart.y)

      // Only add if region is large enough (at least 20x20)
      if (width >= 20 && height >= 20) {
        const newRegion: TransparentRegion = {
          id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x,
          y,
          width,
          height,
        }
        setRegions((prev) => [...prev, newRegion])
      }

      setIsDrawing(false)
      setDrawingStart(null)
      setDrawingCurrent(null)
      setIsAddingRegion(false)
    }

    if (dragState) {
      setDragState(null)
    }
  }

  // Handle region mouse down for dragging
  const handleRegionMouseDown = (e: React.MouseEvent, regionId: string, dragType: DragType) => {
    e.stopPropagation()

    const region = regions.find((r) => r.id === regionId)
    if (!region) return

    const { x, y } = screenToTemplate(e.clientX, e.clientY)

    setSelectedRegionId(regionId)
    setDragState({
      regionId,
      dragType,
      startX: x,
      startY: y,
      startRegion: {
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
      },
    })
  }

  // Handle delete region
  const handleDeleteRegion = (regionId: string) => {
    setRegions((prev) => prev.filter((r) => r.id !== regionId))
    if (selectedRegionId === regionId) {
      setSelectedRegionId(null)
    }
  }

  // Handle save
  const handleSave = () => {
    updateTemplateRegions(template.id, regions)
    onClose()
  }

  // Handle redetect
  const handleRedetect = async () => {
    await redetectTemplateRegions(template.id)
    // Update local state from store
    const store = useTemplateStore.getState()
    const updatedTemplate = store.templates.find((t) => t.id === template.id)
    if (updatedTemplate) {
      setRegions(updatedTemplate.regions)
      setSelectedRegionId(null)
    }
  }

  // Resize handle positions
  const resizeHandles: { position: DragType; cursor: string; style: React.CSSProperties }[] = [
    { position: 'resize-nw', cursor: 'nw-resize', style: { top: -4, left: -4 } },
    { position: 'resize-ne', cursor: 'ne-resize', style: { top: -4, right: -4 } },
    { position: 'resize-sw', cursor: 'sw-resize', style: { bottom: -4, left: -4 } },
    { position: 'resize-se', cursor: 'se-resize', style: { bottom: -4, right: -4 } },
    { position: 'resize-n', cursor: 'n-resize', style: { top: -4, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'resize-s', cursor: 's-resize', style: { bottom: -4, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'resize-w', cursor: 'w-resize', style: { top: '50%', left: -4, transform: 'translateY(-50%)' } },
    { position: 'resize-e', cursor: 'e-resize', style: { top: '50%', right: -4, transform: 'translateY(-50%)' } },
  ]

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-800">编辑模板区域</h2>
          <button
            onClick={onClose}
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

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-4 border-b border-slate-200">
          <button
            onClick={handleRedetect}
            className="px-3 py-1.5 text-sm rounded border border-slate-300 hover:bg-slate-50 text-slate-600 flex items-center gap-1"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            重新检测
          </button>
          <button
            onClick={() => {
              setIsAddingRegion(!isAddingRegion)
              setSelectedRegionId(null)
            }}
            className={`px-3 py-1.5 text-sm rounded border flex items-center gap-1 ${
              isAddingRegion
                ? 'bg-indigo-500 text-white border-indigo-500'
                : 'border-slate-300 hover:bg-slate-50 text-slate-600'
            }`}
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            添加区域
          </button>
          {selectedRegionId && (
            <button
              onClick={() => handleDeleteRegion(selectedRegionId)}
              className="px-3 py-1.5 text-sm rounded border border-red-300 hover:bg-red-50 text-red-600 flex items-center gap-1"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              删除选中
            </button>
          )}
        </div>

        {/* Drawing mode hint */}
        {isAddingRegion && (
          <div className="p-4 bg-indigo-50 border-b border-indigo-200">
            <p className="text-sm text-indigo-700">
              在模板上拖拽绘制新区域，松开鼠标完成绘制
            </p>
          </div>
        )}

        {/* Canvas */}
        <div className="p-4">
          <div
            ref={containerRef}
            className="relative mx-auto rounded-lg overflow-hidden select-none"
            style={{
              width: displayWidth,
              height: displayHeight,
              background:
                'repeating-conic-gradient(#cbd5e1 0% 25%, white 0% 50%) 50% / 16px 16px',
              cursor: isAddingRegion ? 'crosshair' : 'default',
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            {/* Template image */}
            <img
              src={template.dataUrl}
              alt={template.name}
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Region indicators */}
            {regions.map((region, index) => {
              const isSelected = selectedRegionId === region.id

              return (
                <div
                  key={region.id}
                  className={`absolute transition-colors ${
                    isSelected
                      ? 'border-2 border-indigo-500 bg-indigo-500/20'
                      : 'border-2 border-dashed border-blue-500 bg-blue-500/10'
                  }`}
                  style={{
                    left: region.x * scale,
                    top: region.y * scale,
                    width: region.width * scale,
                    height: region.height * scale,
                    cursor: isSelected && !isAddingRegion ? 'move' : 'pointer',
                  }}
                  onMouseDown={(e) => {
                    if (!isAddingRegion) {
                      handleRegionMouseDown(e, region.id, 'move')
                    }
                  }}
                >
                  {/* Region number badge */}
                  <div
                    className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? 'bg-indigo-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteRegion(region.id)
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs opacity-0 hover:opacity-100 transition-opacity shadow-sm"
                    style={{ opacity: isSelected ? 1 : undefined }}
                  >
                    ×
                  </button>

                  {/* Resize handles - only show when selected */}
                  {isSelected && !isAddingRegion && resizeHandles.map((handle) => (
                    <div
                      key={handle.position}
                      className="absolute w-2 h-2 bg-white border-2 border-indigo-500 rounded-sm"
                      style={{
                        ...handle.style,
                        cursor: handle.cursor,
                      }}
                      onMouseDown={(e) => handleRegionMouseDown(e, region.id, handle.position)}
                    />
                  ))}
                </div>
              )
            })}

            {/* Drawing preview */}
            {isDrawing && drawingStart && drawingCurrent && (
              <div
                className="absolute border-2 border-indigo-500 bg-indigo-500/20"
                style={{
                  left: Math.min(drawingStart.x, drawingCurrent.x) * scale,
                  top: Math.min(drawingStart.y, drawingCurrent.y) * scale,
                  width: Math.abs(drawingCurrent.x - drawingStart.x) * scale,
                  height: Math.abs(drawingCurrent.y - drawingStart.y) * scale,
                }}
              />
            )}
          </div>
        </div>

        {/* Region Info */}
        <div className="p-4 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-2">区域信息</h4>
          {regions.length > 0 ? (
            <div className="space-y-1">
              {regions.map((region, index) => (
                <div
                  key={region.id}
                  className={`text-xs p-1.5 rounded ${
                    selectedRegionId === region.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-500'
                  }`}
                >
                  <span className="font-medium">区域 {index + 1}</span>:
                  {' '}({region.x}, {region.y}) - {region.width}×{region.height}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">暂无区域</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border border-slate-300 hover:bg-slate-50 text-slate-600"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm rounded bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}
