import { useRef, useCallback, useEffect, useState } from 'react'
import { useFrameFillStore } from '../../store/framefillStore'
import type { FillRegion, RegionPhotoConfig, FillPhoto } from '../../types/framefill'
import { calculatePhotoPlacement } from '../../services/photoPlacement'

interface CompositionCanvasProps {
  maxDisplaySize?: number
}

interface DragState {
  regionId: string
  startX: number
  startY: number
  startConfig: RegionPhotoConfig
  mode: 'move' | 'resize'
  anchorX?: number
  anchorY?: number
}

export function CompositionCanvas({ maxDisplaySize = 500 }: CompositionCanvasProps) {
  const template = useFrameFillStore((state) => state.template)
  const photos = useFrameFillStore((state) => state.photos)
  const photoConfigs = useFrameFillStore((state) => state.photoConfigs)
  const selectedRegionId = useFrameFillStore((state) => state.selectedRegionId)
  const updatePhotoConfig = useFrameFillStore((state) => state.updatePhotoConfig)
  const selectRegion = useFrameFillStore((state) => state.selectRegion)

  const containerRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [loadedPhotos, setLoadedPhotos] = useState<Map<string, HTMLImageElement>>(new Map())
  const [loadedTemplate, setLoadedTemplate] = useState<HTMLImageElement | null>(null)

  // Calculate display scale
  const scale = template
    ? template.width > template.height
      ? maxDisplaySize / template.width
      : maxDisplaySize / template.height
    : 1
  const displayWidth = template ? template.width * scale : 0
  const displayHeight = template ? template.height * scale : 0

  // Load template image
  useEffect(() => {
    if (!template) {
      setLoadedTemplate(null)
      return
    }

    const img = new Image()
    img.onload = () => setLoadedTemplate(img)
    img.src = template.dataUrl
  }, [template?.dataUrl])

  // Load photo images
  useEffect(() => {
    const newLoadedPhotos = new Map<string, HTMLImageElement>()
    let loaded = 0
    const toLoad = photos.filter(p => !loadedPhotos.has(p.id))

    if (toLoad.length === 0) {
      // All photos already loaded
      photos.forEach(p => {
        const existing = loadedPhotos.get(p.id)
        if (existing) newLoadedPhotos.set(p.id, existing)
      })
      setLoadedPhotos(newLoadedPhotos)
      return
    }

    toLoad.forEach(photo => {
      const img = new Image()
      img.onload = () => {
        newLoadedPhotos.set(photo.id, img)
        loaded++
        if (loaded === toLoad.length) {
          // Copy existing loaded photos
          photos.forEach(p => {
            const existing = loadedPhotos.get(p.id)
            if (existing && !newLoadedPhotos.has(p.id)) {
              newLoadedPhotos.set(p.id, existing)
            }
          })
          setLoadedPhotos(newLoadedPhotos)
        }
      }
      img.src = photo.dataUrl
    })
  }, [photos])

  // Convert screen coordinates to template coordinates
  const screenToTemplate = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current || !template)
        return { x: 0, y: 0 }

      const rect = containerRef.current.getBoundingClientRect()
      const x = (screenX - rect.left) / scale
      const y = (screenY - rect.top) / scale

      return { x, y }
    },
    [scale, template]
  )

  // Get photo for region
  const getPhotoForRegion = (region: FillRegion): FillPhoto | undefined => {
    return photos.find((p) => p.id === region.photoId)
  }

  // Calculate photo drawing parameters
  const calculatePhotoDrawParams = (
    region: FillRegion,
    photo: FillPhoto,
    config: RegionPhotoConfig
  ) => {
    if (!loadedPhotos.has(photo.id)) return null

    const photoImg = loadedPhotos.get(photo.id)!
    const placement = calculatePhotoPlacement(region, photoImg.width, photoImg.height, config)
    return { ...placement, photoImg }
  }

  // Handle mouse down on region for dragging
  const handleRegionMouseDown = (e: React.MouseEvent, regionId: string) => {
    e.stopPropagation()

    const region = template?.regions.find((r) => r.id === regionId)
    if (!region || !region.photoId) return

    const { x, y } = screenToTemplate(e.clientX, e.clientY)
    const config = photoConfigs[regionId] || { offsetX: 0, offsetY: 0, scale: 1 }

    selectRegion(regionId)
    setDragState({
      regionId,
      startX: x,
      startY: y,
      startConfig: { ...config },
      mode: 'move',
    })
  }

  // 四角手柄 mousedown：启动缩放拖拽，以对角点为锚
  const handleResizeMouseDown = (
    e: React.MouseEvent,
    regionId: string,
    corner: 'nw' | 'ne' | 'sw' | 'se'
  ) => {
    e.stopPropagation()
    e.preventDefault()

    const region = template?.regions.find((r) => r.id === regionId)
    if (!region || !region.photoId) return

    const photo = photos.find((p) => p.id === region.photoId)
    if (!photo || !loadedPhotos.has(photo.id)) return

    const config = photoConfigs[regionId] || { offsetX: 0, offsetY: 0, scale: 1 }

    // 对角锚点：拖动某角时，其对角点作为缩放参考原点
    const anchorX = corner.startsWith('w') ? region.x + region.width : region.x
    const anchorY = corner.endsWith('n') ? region.y + region.height : region.y

    const { x, y } = screenToTemplate(e.clientX, e.clientY)
    selectRegion(regionId)
    setDragState({
      regionId,
      startX: x,
      startY: y,
      startConfig: { ...config },
      mode: 'resize',
      anchorX,
      anchorY,
    })
  }

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return

    const { x, y } = screenToTemplate(e.clientX, e.clientY)

    if (dragState.mode === 'resize') {
      // 锁定宽高比：以被拖角的对角点为锚，按鼠标到锚点的距离比换算缩放
      if (dragState.anchorX == null || dragState.anchorY == null) return

      const region = template?.regions.find((r) => r.id === dragState.regionId)
      const photo = region ? photos.find((p) => p.id === region.photoId) : undefined
      if (!region || !photo) return

      const startDist = Math.hypot(dragState.startX - dragState.anchorX, dragState.startY - dragState.anchorY) || 1
      const curDist = Math.hypot(x - dragState.anchorX, y - dragState.anchorY)
      const ratio = curDist / startDist

      // 按原图等比缩放，下限 0.1，上限 10
      const newScale = Math.max(0.1, Math.min(10, dragState.startConfig.scale * ratio))
      updatePhotoConfig(dragState.regionId, { scale: newScale })
      return
    }

    // move 模式：平移
    const deltaX = x - dragState.startX
    const deltaY = y - dragState.startY

    updatePhotoConfig(dragState.regionId, {
      offsetX: dragState.startConfig.offsetX + deltaX,
      offsetY: dragState.startConfig.offsetY + deltaY,
    })
  }

  // Handle mouse up
  const handleMouseUp = () => {
    setDragState(null)
  }

  // Handle click on canvas to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      selectRegion(null)
    }
  }

  if (!template) {
    return (
      <div className="bg-slate-100 rounded-xl p-8 text-center text-slate-500">
        请先上传模板图片
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-slate-700">合成预览</h3>
        <div className="text-xs text-slate-500">
          {selectedRegionId ? '拖拽照片移动位置，拖动四角缩放' : '点击选中区域进行调整'}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative mx-auto rounded-lg overflow-hidden select-none"
        style={{
          width: displayWidth,
          height: displayHeight,
          background:
            'repeating-conic-gradient(#e2e8f0 0% 25%, white 0% 50%) 50% / 16px 16px',
          cursor: dragState ? 'grabbing' : 'default',
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Photo layers (bottom) - 用 clip-path 按区域精确裁切，互不覆盖 */}
        {template.regions.map((region) => {
          const photo = getPhotoForRegion(region)
          if (!photo) return null

          const config = photoConfigs[region.id] || { offsetX: 0, offsetY: 0, scale: 1 }
          const drawParams = calculatePhotoDrawParams(region, photo, config)
          if (!drawParams) return null

          // 照片绝对定位(模板坐标)
          const imgLeft = drawParams.dx * scale
          const imgTop = drawParams.dy * scale
          const imgW = drawParams.dw * scale
          const imgH = drawParams.dh * scale

          // 区域矩形(画布坐标)
          const regLeft = region.x * scale
          const regTop = region.y * scale
          const regW = region.width * scale
          const regH = region.height * scale

          // 计算区域在 img 边框盒内的裁切比例(0~1)，防护除零
          const cl = imgW > 0 ? Math.max(0, Math.min(1, (regLeft - imgLeft) / imgW)) : 0
          const cr = imgW > 0 ? Math.max(0, Math.min(1, (regLeft + regW - imgLeft) / imgW)) : 1
          const ct = imgH > 0 ? Math.max(0, Math.min(1, (regTop - imgTop) / imgH)) : 0
          const cb = imgH > 0 ? Math.max(0, Math.min(1, (regTop + regH - imgTop) / imgH)) : 1
          // inset(上 右 下 左) 用百分比
          const clipTop = (ct * 100).toFixed(4)
          const clipRight = ((1 - cr) * 100).toFixed(4)
          const clipBottom = ((1 - cb) * 100).toFixed(4)
          const clipLeft = (cl * 100).toFixed(4)

          return (
            <img
              key={`photo-${region.id}`}
              src={photo.dataUrl}
              alt=""
              className="absolute pointer-events-none"
              style={{
                left: imgLeft,
                top: imgTop,
                width: imgW,
                height: imgH,
                clipPath: `inset(${clipTop}% ${clipRight}% ${clipBottom}% ${clipLeft}%)`,
              }}
            />
          )
        })}

        {/* Template layer (top) */}
        {loadedTemplate && (
          <img
            src={template.dataUrl}
            alt={template.name}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        )}

        {/* Region overlays for interaction */}
        {template.regions.map((region, index) => {
          const isSelected = selectedRegionId === region.id
          const hasPhoto = region.photoId !== null

          return (
            <div
              key={region.id}
              className={`absolute transition-colors ${
                isSelected
                  ? 'border-2 border-indigo-500 bg-transparent'
                  : 'border-2 border-dashed border-transparent hover:border-slate-300'
              } ${!hasPhoto ? 'bg-slate-500/10' : ''}`}
              style={{
                left: region.x * scale,
                top: region.y * scale,
                width: region.width * scale,
                height: region.height * scale,
                cursor: hasPhoto ? (dragState ? 'grabbing' : 'grab') : 'pointer',
              }}
              onMouseDown={(e) => hasPhoto && handleRegionMouseDown(e, region.id)}
              onClick={(e) => {
                e.stopPropagation()
                selectRegion(region.id)
              }}
            >
              {/* Region number badge */}
              <div
                className={`absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  isSelected
                    ? 'bg-indigo-500 text-white'
                    : hasPhoto
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-400 text-white'
                }`}
              >
                {index + 1}
              </div>

              {/* Empty region indicator */}
              {!hasPhoto && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-slate-400"
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
                </div>
              )}

              {/* 四角缩放手柄：仅选中且有照片时显示 */}
              {isSelected && hasPhoto && (
                <>
                  {([
                    { corner: 'nw', cls: '-top-1.5 -left-1.5 cursor-nwse-resize' },
                    { corner: 'ne', cls: '-top-1.5 -right-1.5 cursor-nesw-resize' },
                    { corner: 'sw', cls: '-bottom-1.5 -left-1.5 cursor-nesw-resize' },
                    { corner: 'se', cls: '-bottom-1.5 -right-1.5 cursor-nwse-resize' },
                  ] as const).map(({ corner, cls }) => (
                    <div
                      key={corner}
                      className={`absolute w-3 h-3 bg-white border-2 border-indigo-500 rounded-sm shadow-sm z-10 ${cls}`}
                      onMouseDown={(e) => handleResizeMouseDown(e, region.id, corner)}
                    />
                  ))}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* 刻度尺：相对满屏的缩放比例 + 实际渲染尺寸 */}
      {selectedRegionId &&
        (() => {
          const region = template.regions.find((r) => r.id === selectedRegionId)
          const photo = region ? getPhotoForRegion(region) : undefined
          const config = photoConfigs[selectedRegionId] || { offsetX: 0, offsetY: 0, scale: 1 }
          const zoomPct = Math.round(config.scale * 100)
          let photoW = 0,
            photoH = 0
          if (region && photo && loadedPhotos.has(photo.id)) {
            const img = loadedPhotos.get(photo.id)!
            const placement = calculatePhotoPlacement(region, img.width, img.height, config)
            photoW = Math.round(placement.dw)
            photoH = Math.round(placement.dh)
          }
          return (
            <div className="mt-3 flex flex-col items-center gap-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-4 font-mono tabular-nums">
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">缩放</span>
                  <span className="text-slate-700 font-medium">{zoomPct}</span>
                  <span className="text-slate-400">%</span>
                </span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">尺寸</span>
                  <span className="text-slate-700 font-medium">{photoW}×{photoH}</span>
                  <span className="text-slate-400">px</span>
                </span>
              </div>
              {region && (
                <div className="text-[11px] text-slate-400">
                  区域 {Math.round(region.width)}×{Math.round(region.height)} px
                </div>
              )}
            </div>
          )
        })()}
    </div>
  )
}
