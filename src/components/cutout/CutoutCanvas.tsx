import { useCallback, useEffect, useRef, useState } from 'react'
import { useCutoutStore } from '../../store/cutoutStore'
import { floodFill, makeFreehandTransparent } from '../../services/magicWand'
import type { Point } from '../../types/cutout'

export function CutoutCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    image,
    selectionMode,
    tolerance,
    zoom,
    saveToHistory,
    updateProcessedImage,
    canvasUpdateKey,
    history,
    historyIndex,
    resetKey,
    // Rectangle state from store
    rectX,
    rectY,
    rectWidth,
    rectHeight,
    setRectFromDrag,
  } = useCutoutStore()

  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [freehandPath, setFreehandPath] = useState<Point[]>([])
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null)

  // Threshold for detecting proximity to start point (in display pixels)
  const CLOSE_THRESHOLD = 15

  // Load image to canvas when image changes or reset
  useEffect(() => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Save initial state to history
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      saveToHistory(imageData)
    }
    img.src = image.processedDataUrl
  }, [image?.id, resetKey])

  // Apply history state when undo
  useEffect(() => {
    if (!canvasRef.current || historyIndex < 0 || history.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const historyState = history[historyIndex]
    if (historyState) {
      ctx.putImageData(historyState.imageData, 0, 0)
      const dataUrl = canvas.toDataURL('image/png')
      updateProcessedImage(dataUrl)
    }
  }, [canvasUpdateKey, historyIndex])

  // Get canvas coordinates from mouse event
  const getCanvasCoords = useCallback((e: React.MouseEvent): Point | null => {
    if (!canvasRef.current) return null

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: Math.floor((e.clientX - rect.left) * scaleX),
      y: Math.floor((e.clientY - rect.top) * scaleY),
    }
  }, [])

  // Get canvas coordinates from touch event
  const getTouchCoords = useCallback((e: React.TouchEvent): Point | null => {
    if (!canvasRef.current || e.touches.length === 0) return null

    const touch = e.touches[0]
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: Math.floor((touch.clientX - rect.left) * scaleX),
      y: Math.floor((touch.clientY - rect.top) * scaleY),
    }
  }, [])

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const point = getCanvasCoords(e)
      if (!point) return

      if (selectionMode === 'magicWand') {
        // Magic wand - immediate action
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const newImageData = floodFill(imageData, point.x, point.y, tolerance)

        ctx.putImageData(newImageData, 0, 0)
        saveToHistory(newImageData)

        const dataUrl = canvas.toDataURL('image/png')
        updateProcessedImage(dataUrl)
      } else if (selectionMode === 'rectangle') {
        // Rectangle - start drawing
        setIsDrawing(true)
        setStartPoint(point)
        setRectFromDrag(point.x, point.y, 0, 0)
      } else if (selectionMode === 'freehand') {
        // Freehand - start drawing
        setIsDrawing(true)
        setFreehandPath([point])
      }
    },
    [selectionMode, tolerance, getCanvasCoords, saveToHistory, updateProcessedImage, setRectFromDrag]
  )

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing) return

      const point = getCanvasCoords(e)
      if (!point) return

      setCurrentPoint(point) // Record current position

      if (selectionMode === 'rectangle' && startPoint) {
        const x = Math.min(startPoint.x, point.x)
        const y = Math.min(startPoint.y, point.y)
        const width = Math.abs(point.x - startPoint.x)
        const height = Math.abs(point.y - startPoint.y)
        setRectFromDrag(x, y, width, height)
      } else if (selectionMode === 'freehand') {
        setFreehandPath((prev) => [...prev, point])
      }
    },
    [isDrawing, selectionMode, startPoint, getCanvasCoords, setRectFromDrag]
  )

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) {
      setIsDrawing(false)
      setStartPoint(null)
      setFreehandPath([])
      setCurrentPoint(null)
      return
    }

    if (selectionMode === 'rectangle' && rectWidth > 0 && rectHeight > 0) {
      // Rectangle mode: just stop drawing, don't auto-apply
      // User needs to click "Apply" button to apply the cutout
    } else if (selectionMode === 'freehand' && freehandPath.length > 2) {
      // Calculate scale inside the callback to avoid stale closure
      const maxDisplayWidth = 800
      const maxDisplayHeight = 600
      const scaleXCalc = maxDisplayWidth / image!.width
      const scaleYCalc = maxDisplayHeight / image!.height
      const baseScale = Math.min(scaleXCalc, scaleYCalc, 1)
      const currentScale = Math.floor(image!.width * baseScale * zoom) / image!.width

      // Check if near start point
      const start = freehandPath[0]
      const end = freehandPath[freehandPath.length - 1]
      const displayDist = Math.sqrt(
        ((end.x - start.x) * currentScale) ** 2 +
        ((end.y - start.y) * currentScale) ** 2
      )

      // Only execute if near start point
      if (displayDist >= CLOSE_THRESHOLD) {
        // Not near start point, cancel operation
        setIsDrawing(false)
        setFreehandPath([])
        setCurrentPoint(null)
        return
      }

      // Execute cutout
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const newImageData = makeFreehandTransparent(imageData, freehandPath)

      ctx.putImageData(newImageData, 0, 0)
      saveToHistory(newImageData)

      const dataUrl = canvas.toDataURL('image/png')
      updateProcessedImage(dataUrl)
    }

    setIsDrawing(false)
    setStartPoint(null)
    setFreehandPath([])
    setCurrentPoint(null)
  }, [isDrawing, selectionMode, rectX, rectY, rectWidth, rectHeight, freehandPath, saveToHistory, updateProcessedImage, image, zoom])

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      const point = getTouchCoords(e)
      if (!point) return

      if (selectionMode === 'magicWand') {
        // Magic wand - immediate action
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const newImageData = floodFill(imageData, point.x, point.y, tolerance)

        ctx.putImageData(newImageData, 0, 0)
        saveToHistory(newImageData)

        const dataUrl = canvas.toDataURL('image/png')
        updateProcessedImage(dataUrl)
      } else if (selectionMode === 'rectangle') {
        // Rectangle - start drawing
        setIsDrawing(true)
        setStartPoint(point)
        setRectFromDrag(point.x, point.y, 0, 0)
      } else if (selectionMode === 'freehand') {
        // Freehand - start drawing
        setIsDrawing(true)
        setFreehandPath([point])
      }
    },
    [selectionMode, tolerance, getTouchCoords, saveToHistory, updateProcessedImage, setRectFromDrag]
  )

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault() // Prevent page scrolling
      if (!isDrawing) return

      const point = getTouchCoords(e)
      if (!point) return

      setCurrentPoint(point) // Record current position

      if (selectionMode === 'rectangle' && startPoint) {
        const x = Math.min(startPoint.x, point.x)
        const y = Math.min(startPoint.y, point.y)
        const width = Math.abs(point.x - startPoint.x)
        const height = Math.abs(point.y - startPoint.y)
        setRectFromDrag(x, y, width, height)
      } else if (selectionMode === 'freehand') {
        setFreehandPath((prev) => [...prev, point])
      }
    },
    [isDrawing, selectionMode, startPoint, getTouchCoords, setRectFromDrag]
  )

  // Handle touch end
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      if (!isDrawing) return

      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) {
        setIsDrawing(false)
        setStartPoint(null)
        setFreehandPath([])
        setCurrentPoint(null)
        return
      }

      if (selectionMode === 'rectangle' && rectWidth > 0 && rectHeight > 0) {
        // Rectangle mode: just stop drawing, don't auto-apply
        // User needs to click "Apply" button to apply the cutout
      } else if (selectionMode === 'freehand' && freehandPath.length > 2) {
        // Calculate scale inside the callback to avoid stale closure
        const maxDisplayWidth = 800
        const maxDisplayHeight = 600
        const scaleXCalc = maxDisplayWidth / image!.width
        const scaleYCalc = maxDisplayHeight / image!.height
        const baseScale = Math.min(scaleXCalc, scaleYCalc, 1)
        const currentScale = Math.floor(image!.width * baseScale * zoom) / image!.width

        // Check if near start point
        const start = freehandPath[0]
        const end = freehandPath[freehandPath.length - 1]
        const displayDist = Math.sqrt(
          ((end.x - start.x) * currentScale) ** 2 +
          ((end.y - start.y) * currentScale) ** 2
        )

        // Only execute if near start point
        if (displayDist >= CLOSE_THRESHOLD) {
          // Not near start point, cancel operation
          setIsDrawing(false)
          setFreehandPath([])
          setCurrentPoint(null)
          return
        }

        // Execute cutout
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const newImageData = makeFreehandTransparent(imageData, freehandPath)

        ctx.putImageData(newImageData, 0, 0)
        saveToHistory(newImageData)

        const dataUrl = canvas.toDataURL('image/png')
        updateProcessedImage(dataUrl)
      }

      setIsDrawing(false)
      setStartPoint(null)
      setFreehandPath([])
      setCurrentPoint(null)
    },
    [isDrawing, selectionMode, rectWidth, rectHeight, freehandPath, saveToHistory, updateProcessedImage, image, zoom]
  )

  if (!image) return null

  // Calculate display dimensions with consistent scaling
  const maxDisplayWidth = 800
  const maxDisplayHeight = 600

  // Calculate scale that fits within both constraints
  const scaleX = maxDisplayWidth / image.width
  const scaleY = maxDisplayHeight / image.height
  const baseScale = Math.min(scaleX, scaleY, 1) // Don't upscale

  const displayWidth = Math.floor(image.width * baseScale * zoom)
  const displayHeight = Math.floor(image.height * baseScale * zoom)
  const scale = displayWidth / image.width

  // Calculate if mouse is near start point for freehand mode
  const isNearStart = isDrawing &&
    selectionMode === 'freehand' &&
    freehandPath.length > 2 &&
    currentPoint &&
    (() => {
      const start = freehandPath[0]
      const displayDist = Math.sqrt(
        ((currentPoint.x - start.x) * scale) ** 2 +
        ((currentPoint.y - start.y) * scale) ** 2
      )
      return displayDist < CLOSE_THRESHOLD
    })()

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center p-4 bg-slate-100 rounded-xl"
      style={{ maxWidth: '100%', overflow: 'hidden' }}
    >
      <div
        className="relative inline-block"
        style={{
          width: displayWidth,
          height: displayHeight,
        }}
      >
        {/* Checkerboard background for transparency */}
        <div
          className="absolute inset-0 rounded"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
              linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
              linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        />

        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="absolute top-0 left-0 cursor-crosshair"
          style={{ width: displayWidth, height: displayHeight }}
        />

        {/* Rectangle preview overlay */}
        {selectionMode === 'rectangle' && rectWidth > 0 && rectHeight > 0 && (
          <div
            className="absolute pointer-events-none border-2 border-dashed border-indigo-500 bg-indigo-500/10"
            style={{
              left: rectX * scale,
              top: rectY * scale,
              width: rectWidth * scale,
              height: rectHeight * scale,
            }}
          />
        )}

        {/* Freehand path preview */}
        {isDrawing && selectionMode === 'freehand' && freehandPath.length > 1 && (
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={displayWidth}
            height={displayHeight}
          >
            {/* Drawn path (not closed) */}
            <path
              d={freehandPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * scale} ${p.y * scale}`).join(' ')}
              fill="none"
              stroke="rgb(239, 68, 68)"
              strokeWidth={2}
              strokeDasharray="5,5"
            />

            {/* Closing preview line when near start */}
            {isNearStart && (
              <path
                d={`M ${freehandPath[freehandPath.length - 1].x * scale} ${freehandPath[freehandPath.length - 1].y * scale} L ${freehandPath[0].x * scale} ${freehandPath[0].y * scale}`}
                fill="none"
                stroke="rgb(239, 68, 68)"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
            )}

            {/* Start point circle */}
            <circle
              cx={freehandPath[0].x * scale}
              cy={freehandPath[0].y * scale}
              r={isNearStart ? 10 : 6}
              fill={isNearStart ? 'rgb(239, 68, 68)' : 'white'}
              stroke="rgb(239, 68, 68)"
              strokeWidth={2}
            />
          </svg>
        )}
      </div>
    </div>
  )
}
