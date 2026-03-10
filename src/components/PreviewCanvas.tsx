import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { calculateLayouts, getBackgroundPreset } from '../services/layoutEngine'
import { drawWatermark } from '../utils/watermark'
import type { Project, WatermarkOptions } from '../types'

interface MiniPreviewProps {
  project: Project
  backgroundPreset: string
  scale?: number
}

function MiniPreview({ project, backgroundPreset, scale = 0.08 }: MiniPreviewProps) {
  const { canvasWidth, canvasHeight, layouts } = useMemo(
    () => calculateLayouts(project.images),
    [project.images]
  )

  const preset = getBackgroundPreset(backgroundPreset)

  return (
    <div
      className="relative"
      style={{
        width: canvasWidth * scale,
        height: canvasHeight * scale,
        background: preset.isGradient
          ? `linear-gradient(135deg, rgb(${preset.startColor.join(',')}) 0%, rgb(${preset.endColor.join(',')}) 100%)`
          : `rgb(${preset.startColor.join(',')})`,
      }}
    >
      {layouts.map((layout, idx) => {
        const img = project.images[layout.imageIndex]
        if (!img) return null

        return (
          <div
            key={idx}
            className="absolute overflow-hidden"
            style={{
              left: layout.x * scale,
              top: layout.y * scale,
              width: layout.width * scale,
              height: layout.height * scale,
            }}
          >
            <img
              src={img.dataUrl}
              alt={img.name}
              className="w-full h-full object-cover"
            />
          </div>
        )
      })}
    </div>
  )
}

interface LargePreviewProps {
  project: Project
  backgroundPreset: string
  watermark: WatermarkOptions
  onClick?: () => void
}

function LargePreview({ project, backgroundPreset, watermark, onClick }: LargePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { canvasWidth, canvasHeight, layouts, preset, scale, dpr } = useMemo(() => {
    const { canvasWidth, canvasHeight, layouts } = calculateLayouts(project.images)
    const preset = getBackgroundPreset(backgroundPreset)
    const maxPreviewWidth = 400
    const maxPreviewHeight = 300
    const scale = Math.min(maxPreviewWidth / canvasWidth, maxPreviewHeight / canvasHeight, 1)
    const dpr = window.devicePixelRatio || 1
    return { canvasWidth, canvasHeight, layouts, preset, scale, dpr }
  }, [project.images, backgroundPreset])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const displayWidth = canvasWidth * scale
    const displayHeight = canvasHeight * scale

    // 设置 canvas 实际像素尺寸（高清适配）
    canvas.width = displayWidth * dpr
    canvas.height = displayHeight * dpr

    // 缩放 context 以匹配 devicePixelRatio
    ctx.scale(dpr, dpr)

    // Draw background
    if (preset.isGradient) {
      const gradient = ctx.createLinearGradient(0, 0, displayWidth, displayHeight)
      gradient.addColorStop(0, `rgb(${preset.startColor.join(',')})`)
      gradient.addColorStop(1, `rgb(${preset.endColor.join(',')})`)
      ctx.fillStyle = gradient
    } else {
      ctx.fillStyle = `rgb(${preset.startColor.join(',')})`
    }
    ctx.fillRect(0, 0, displayWidth, displayHeight)

    // Load and draw images
    const loadImages = async () => {
      const imagePromises = project.images.map(
        (img) =>
          new Promise<HTMLImageElement>((resolve) => {
            const image = new Image()
            image.onload = () => resolve(image)
            image.src = img.dataUrl
          })
      )
      return Promise.all(imagePromises)
    }

    loadImages().then((loadedImages) => {
      // Draw images
      layouts.forEach((layout) => {
        const img = loadedImages[layout.imageIndex]
        if (!img) return

        ctx.drawImage(
          img,
          layout.x * scale,
          layout.y * scale,
          layout.width * scale,
          layout.height * scale
        )
      })

      // Draw watermark using the same function as export
      if (watermark.enabled && watermark.text) {
        const scaledWatermark = {
          ...watermark,
          fontSize: watermark.fontSize * scale,
          tileSpacing: watermark.tileSpacing * scale,
        }
        drawWatermark(ctx, scaledWatermark, displayWidth, displayHeight)
      }
    })
  }, [canvasWidth, canvasHeight, layouts, preset, watermark, scale, dpr, project.images])

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-xl">
        <span className="text-sm font-medium text-slate-700">{project.name}</span>
        <span className="ml-2 text-xs text-slate-500">
          {canvasWidth} x {canvasHeight}
        </span>
        {onClick && (
          <span className="ml-2 text-xs text-indigo-500">点击查看大图</span>
        )}
      </div>
      <div
        className={`p-4 flex justify-center bg-slate-100 rounded-b-xl ${onClick ? 'cursor-pointer hover:bg-slate-200 transition-colors' : ''}`}
        onClick={onClick}
      >
        <canvas
          ref={canvasRef}
          style={{ width: canvasWidth * scale, height: canvasHeight * scale }}
          className="shadow-lg"
        />
      </div>
    </div>
  )
}

// 全屏预览弹窗
interface FullscreenPreviewProps {
  project: Project
  backgroundPreset: string
  watermark: WatermarkOptions
  onClose: () => void
}

function FullscreenPreview({ project, backgroundPreset, watermark, onClose }: FullscreenPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { canvasWidth, canvasHeight, layouts, preset, scale, dpr } = useMemo(() => {
    const { canvasWidth, canvasHeight, layouts } = calculateLayouts(project.images)
    const preset = getBackgroundPreset(backgroundPreset)
    const maxScreenWidth = window.innerWidth * 0.9
    const maxScreenHeight = window.innerHeight * 0.85
    const scale = Math.min(maxScreenWidth / canvasWidth, maxScreenHeight / canvasHeight, 1)
    const dpr = window.devicePixelRatio || 1
    return { canvasWidth, canvasHeight, layouts, preset, scale, dpr }
  }, [project.images, backgroundPreset])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const displayWidth = canvasWidth * scale
    const displayHeight = canvasHeight * scale

    // 设置 canvas 实际像素尺寸（高清适配）
    canvas.width = displayWidth * dpr
    canvas.height = displayHeight * dpr

    // 缩放 context 以匹配 devicePixelRatio
    ctx.scale(dpr, dpr)

    // Draw background
    if (preset.isGradient) {
      const gradient = ctx.createLinearGradient(0, 0, displayWidth, displayHeight)
      gradient.addColorStop(0, `rgb(${preset.startColor.join(',')})`)
      gradient.addColorStop(1, `rgb(${preset.endColor.join(',')})`)
      ctx.fillStyle = gradient
    } else {
      ctx.fillStyle = `rgb(${preset.startColor.join(',')})`
    }
    ctx.fillRect(0, 0, displayWidth, displayHeight)

    // Load and draw images
    const loadImages = async () => {
      const imagePromises = project.images.map(
        (img) =>
          new Promise<HTMLImageElement>((resolve) => {
            const image = new Image()
            image.onload = () => resolve(image)
            image.src = img.dataUrl
          })
      )
      return Promise.all(imagePromises)
    }

    loadImages().then((loadedImages) => {
      layouts.forEach((layout) => {
        const img = loadedImages[layout.imageIndex]
        if (!img) return

        ctx.drawImage(
          img,
          layout.x * scale,
          layout.y * scale,
          layout.width * scale,
          layout.height * scale
        )
      })

      if (watermark.enabled && watermark.text) {
        const scaledWatermark = {
          ...watermark,
          fontSize: watermark.fontSize * scale,
          tileSpacing: watermark.tileSpacing * scale,
        }
        drawWatermark(ctx, scaledWatermark, displayWidth, displayHeight)
      }
    })
  }, [canvasWidth, canvasHeight, layouts, preset, watermark, scale, dpr, project.images])

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 图片信息 */}
        <div className="text-center text-white/80 mb-2 text-sm">
          {project.name} - {canvasWidth} x {canvasHeight}
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{ width: canvasWidth * scale, height: canvasHeight * scale }}
          className="shadow-2xl"
        />

        {/* 提示 */}
        <div className="text-center text-white/60 mt-2 text-xs">
          按 Esc 或点击背景关闭
        </div>
      </div>
    </div>
  )
}

export function PreviewCanvas() {
  const projects = useAppStore((s) => s.projects)
  const selectedProjectId = useAppStore((s) => s.selectedProjectId)
  const selectProject = useAppStore((s) => s.selectProject)
  const background = useAppStore((s) => s.background)
  const watermark = useAppStore((s) => s.watermark)

  const [showFullscreen, setShowFullscreen] = useState(false)

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || projects[0],
    [projects, selectedProjectId]
  )

  const handleOpenFullscreen = useCallback(() => {
    setShowFullscreen(true)
  }, [])

  const handleCloseFullscreen = useCallback(() => {
    setShowFullscreen(false)
  }, [])

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <span className="text-sm font-medium text-slate-700">预览</span>
        </div>
        <div className="p-8 text-center text-slate-500">
          <p>请先添加图片或文件夹</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <span className="text-sm font-medium text-slate-700">预览</span>
        </div>
        <div className="p-4">
          <div className="flex gap-4">
            {/* Left: Thumbnail List */}
            <div className="w-28 flex-shrink-0 space-y-2 max-h-[400px] overflow-y-auto">
              {projects.map((project) => {
                const isSelected = project.id === selectedProjectId
                return (
                  <div
                    key={project.id}
                    onClick={() => selectProject(project.id)}
                    className={`
                      cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                      ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-200'
                          : 'border-slate-200 hover:border-indigo-300'
                      }
                    `}
                  >
                    <div className="flex justify-center p-1 bg-slate-50">
                      <MiniPreview project={project} backgroundPreset={background.preset} />
                    </div>
                    <div className="p-1 text-xs text-center truncate text-slate-600">
                      {project.name}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right: Large Preview */}
            <div className="flex-1 min-w-0">
              {selectedProject ? (
                <LargePreview
                  project={selectedProject}
                  backgroundPreset={background.preset}
                  watermark={watermark}
                  onClick={handleOpenFullscreen}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  选择一个项目查看预览
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 全屏预览弹窗 */}
      {showFullscreen && selectedProject && (
        <FullscreenPreview
          project={selectedProject}
          backgroundPreset={background.preset}
          watermark={watermark}
          onClose={handleCloseFullscreen}
        />
      )}
    </>
  )
}
