import { useRef, useCallback, useEffect, useState } from 'react'
import { useFrameFillStore } from '../../store/framefillStore'
import type { FillRegion, RegionPhotoConfig, FillPhoto } from '../../types/framefill'

interface CompositionCanvasProps {
  maxDisplaySize?: number
}

interface DragState {
  regionId: string
  startX: number
  startY: number
  startConfig: RegionPhotoConfig
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
    const photoRatio = photoImg.width / photoImg.height
    const regionRatio = region.width / region.height

    // Calculate base fit (cover mode)
    let baseWidth: number, baseHeight: number
    if (photoRatio > regionRatio) {
      baseHeight = region.height
      baseWidth = baseHeight * photoRatio
    } else {
      baseWidth = region.width
      baseHeight = baseWidth / photoRatio
    }

    // Apply scale
    const scaledWidth = baseWidth * config.scale
    const scaledHeight = baseHeight * config.scale

    // Center position with offset
    const baseX = region.x + (region.width - baseWidth) / 2
    const baseY = region.y + (region.height - baseHeight) / 2

    const dx = baseX - (scaledWidth - baseWidth) / 2 + config.offsetX
    const dy = baseY - (scaledHeight - baseHeight) / 2 + config.offsetY

    return {
      dx,
      dy,
      dw: scaledWidth,
      dh: scaledHeight,
      photoImg,
    }
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
    })
  }

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return

    const { x, y } = screenToTemplate(e.clientX, e.clientY)
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

  // Handle wheel for scaling
  const handleWheel = (e: React.WheelEvent) => {
    if (!selectedRegionId) return

    e.preventDefault()
    const config = photoConfigs[selectedRegionId] || { offsetX: 0, offsetY: 0, scale: 1 }

    // Scale by 0.1 per wheel tick
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.max(0.5, Math.min(3, config.scale + delta))

    updatePhotoConfig(selectedRegionId, { scale: newScale })
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
          {selectedRegionId ? '拖拽调整位置，滚轮缩放' : '点击选中区域进行调整'}
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
        onWheel={handleWheel}
      >
        {/* Photo layers (bottom) - with clipping */}
        {template.regions.map((region) => {
          const photo = getPhotoForRegion(region)
          if (!photo) return null

          const config = photoConfigs[region.id] || { offsetX: 0, offsetY: 0, scale: 1 }
          const drawParams = calculatePhotoDrawParams(region, photo, config)
          if (!drawParams) return null

          return (
            <div
              key={`photo-container-${region.id}`}
              className="absolute overflow-hidden pointer-events-none"
              style={{
                left: region.x * scale,
                top: region.y * scale,
                width: region.width * scale,
                height: region.height * scale,
              }}
            >
              <img
                src={photo.dataUrl}
                alt=""
                className="absolute"
                style={{
                  left: (drawParams.dx - region.x) * scale,
                  top: (drawParams.dy - region.y) * scale,
                  width: drawParams.dw * scale,
                  height: drawParams.dh * scale,
                  objectFit: 'fill',
                }}
              />
            </div>
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
            </div>
          )
        })}
      </div>

      {/* Scale info for selected region */}
      {selectedRegionId && (
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span>
            缩放:{' '}
            {Math.round((photoConfigs[selectedRegionId]?.scale || 1) * 100)}%
          </span>
          <span>·</span>
          <span>
            偏移: ({Math.round(photoConfigs[selectedRegionId]?.offsetX || 0)},{' '}
            {Math.round(photoConfigs[selectedRegionId]?.offsetY || 0)})
          </span>
        </div>
      )}
    </div>
  )
}
