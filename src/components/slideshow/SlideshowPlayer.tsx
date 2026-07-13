import { useEffect, useRef, useState, useCallback } from 'react'
import { useSlideshowStore } from '../../store/slideshowStore'
import { AudioPlayer } from './AudioPlayer'
import { useAudioControls } from './useAudioControls'

export function SlideshowPlayer() {
  const images = useSlideshowStore((state) => state.images)
  const settings = useSlideshowStore((state) => state.settings)
  const isPlaying = useSlideshowStore((state) => state.isPlaying)
  const isPaused = useSlideshowStore((state) => state.isPaused)
  const currentIndex = useSlideshowStore((state) => state.currentIndex)
  const stop = useSlideshowStore((state) => state.stop)
  const next = useSlideshowStore((state) => state.next)
  const prev = useSlideshowStore((state) => state.prev)
  const pause = useSlideshowStore((state) => state.pause)
  const resume = useSlideshowStore((state) => state.resume)

  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  // 音频控制
  const { toggleMute, increaseVolume, decreaseVolume } = useAudioControls()

  // 自动切换
  useEffect(() => {
    if (!isPlaying || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      setTransitioning(true)
      setTimeout(() => {
        next()
        setTransitioning(false)
      }, 300)
    }, settings.interval * 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPlaying, isPaused, settings.interval, next])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          if (isPaused) {
            resume()
          } else {
            pause()
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          prev()
          break
        case 'ArrowRight':
          e.preventDefault()
          next()
          break
        case 'ArrowUp':
          e.preventDefault()
          increaseVolume()
          break
        case 'ArrowDown':
          e.preventDefault()
          decreaseVolume()
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
        case 'Escape':
          e.preventDefault()
          if (isFullscreen) document.exitFullscreen()
          else stop()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, isPaused, isFullscreen, pause, resume, next, prev, stop, toggleMute, increaseVolume, decreaseVolume])

  // 全屏监听
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const enterFullscreen = useCallback(() => {
    containerRef.current?.requestFullscreen()
  }, [])

  const handleExit = useCallback(() => {
    if (isFullscreen) document.exitFullscreen()
    else stop()
  }, [isFullscreen, stop])

  // 获取动画样式
  const getTransitionStyle = (): React.CSSProperties => {
    const duration = 300
    const base: React.CSSProperties = {
      transition: `all ${duration}ms ease-in-out`,
    }

    if (transitioning) {
      switch (settings.transition) {
        case 'fade': return { ...base, opacity: 0 }
        case 'slide': return { ...base, transform: 'translateX(100%)' }
        case 'zoom': return { ...base, transform: 'scale(0.8)', opacity: 0 }
        case 'flip': return { ...base, transform: 'rotateY(90deg)' }
        case 'rotate': return { ...base, transform: 'rotate(180deg)', opacity: 0 }
        default: return { ...base, opacity: 0 }
      }
    }

    return { ...base, opacity: 1, transform: 'none' }
  }

  if (!isPlaying || images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      style={{ backgroundColor: settings.bgColor }}
    >
      {/* 音频播放器 */}
      <AudioPlayer />

      {/* 模糊背景 */}
      {settings.fitMode === 'blur-bg' && (
        <div
          className="absolute inset-0 blur-xl scale-110 opacity-60"
          style={{ backgroundImage: `url(${currentImage.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}

      {/* 图片 */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={currentImage.url}
          alt={currentImage.name}
          className={
            settings.fitMode === 'cover'
              ? 'absolute inset-0 w-full h-full object-cover'
              : 'max-w-full max-h-full object-contain'
          }
          style={getTransitionStyle()}
        />
      </div>

      {/* 暗角效果 */}
      {settings.effect === 'vignette' && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)' }}
        />
      )}

      {/* 底部信息 */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
        {settings.showFilename && (
          <div className="text-white text-sm mb-2 truncate">{currentImage.name}</div>
        )}
        {settings.showIndex && (
          <div className="text-white/80 text-xs mb-2">{currentIndex + 1} / {images.length}</div>
        )}
        {settings.showProgress && (
          <div className="h-1 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all" style={{ width: `${((currentIndex + 1) / images.length) * 100}%` }} />
          </div>
        )}
      </div>

      {/* 暂停指示 */}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="white" className="opacity-80">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        </div>
      )}

      {/* 控制按钮 */}
      <div className="absolute top-4 right-4 flex gap-2">
        {!isFullscreen && (
          <button onClick={enterFullscreen} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        )}
        <button onClick={handleExit} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* 快捷键提示 */}
      <div className="absolute bottom-4 right-4 text-white/50 text-xs text-right">
        <div>空格: 暂停 | ← →: 切换 | Esc: 退出</div>
        <div>M: 静音 | ↑ ↓: 音量</div>
      </div>
    </div>
  )
}
