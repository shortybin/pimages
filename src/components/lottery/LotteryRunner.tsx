import { useEffect, useRef, useState, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { useLotteryStore } from '../../store/lotteryStore'

export function LotteryRunner() {
  const images = useLotteryStore((state) => state.images)
  const settings = useLotteryStore((state) => state.settings)
  const drawnIds = useLotteryStore((state) => state.drawnIds)
  const draw = useLotteryStore((state) => state.draw)
  const isFullscreen = useLotteryStore((state) => state.isFullscreen)
  const setRunning = useLotteryStore((state) => state.setRunning)
  const setFullscreen = useLotteryStore((state) => state.setFullscreen)

  const containerRef = useRef<HTMLDivElement>(null)
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [phase, setPhase] = useState<'running' | 'result'>('running')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [winners, setWinners] = useState<typeof images>([])
  const [isManualStopped, setIsManualStopped] = useState(false)

  // 可参与抽奖的图片
  const availableImages = settings.noRepeat
    ? images.filter(img => !drawnIds.includes(img.id))
    : images

  // 动画速度映射（毫秒）
  const speedMap = { slow: 80, medium: 50, fast: 30 }
  const intervalMs = speedMap[settings.animationSpeed]

  // 计算自动停止的滚动次数
  const calculateMaxCount = useCallback(() => {
    if (settings.stopMode === 'auto') {
      return Math.floor((settings.autoStopSeconds * 1000) / intervalMs)
    }
    return 999999
  }, [settings.stopMode, settings.autoStopSeconds, intervalMs])

  // 滚动动画效果
  useEffect(() => {
    if (phase !== 'running') return

    let count = 0
    const maxCount = calculateMaxCount()

    const timer = setInterval(() => {
      setCurrentIndex(Math.floor(Math.random() * availableImages.length))
      count++

      if (settings.stopMode === 'auto' && count >= maxCount) {
        clearInterval(timer)
        finishDraw()
      } else if (settings.stopMode === 'manual' && isManualStopped) {
        clearInterval(timer)
        finishDraw()
      }
    }, intervalMs)

    return () => clearInterval(timer)
  }, [phase, settings.animationSpeed, settings.stopMode, settings.autoStopSeconds, availableImages.length, isManualStopped, calculateMaxCount])

  // 彩带庆祝效果
  const fireConfetti = useCallback(() => {
    // 创建或获取 canvas 元素
    let canvas = confettiCanvasRef.current
    if (!canvas && containerRef.current) {
      canvas = document.createElement('canvas')
      canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;'
      containerRef.current.appendChild(canvas)
      confettiCanvasRef.current = canvas
    }

    const duration = 4000
    const animationEnd = Date.now() + duration

    const defaults = {
      startVelocity: 45,
      spread: 360,
      ticks: 100,
      zIndex: 100,
      scalar: 1.5,
      gravity: 0.8,
      drift: 0,
      colors: ['#ff0000', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff69b4', '#9b59b6']
    }

    // 自定义 confetti 配置，使用自定义 canvas
    const myConfetti = canvas ? confetti.create(canvas, { resize: true }) : confetti

    // 开场大爆发 - 屏幕中央
    myConfetti({
      particleCount: 150,
      origin: { x: 0.5, y: 0.5 },
      ...defaults,
      spread: 100,
      scalar: 2
    })

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 80 * (timeLeft / duration)

      myConfetti({
        ...defaults,
        particleCount,
        origin: { x: 0.1, y: Math.random() * 0.4 + 0.3 }
      })

      myConfetti({
        ...defaults,
        particleCount,
        origin: { x: 0.9, y: Math.random() * 0.4 + 0.3 }
      })
    }, 200)
  }, [])

  // 完成抽奖
  const finishDraw = useCallback(() => {
    const selected = draw()
    if (selected && selected.length > 0) {
      setWinners(selected)
      setPhase('result')
      fireConfetti()
    }
  }, [draw, fireConfetti])

  // 手动停止
  const handleManualStop = useCallback(() => {
    if (settings.stopMode === 'manual' && phase === 'running') {
      setIsManualStopped(true)
    }
  }, [settings.stopMode, phase])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        handleClose()
      }
      if (e.code === 'Space' && phase === 'running') {
        e.preventDefault()
        if (settings.stopMode === 'manual') {
          handleManualStop()
        } else {
          finishDraw()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, settings.stopMode, finishDraw, handleManualStop])

  // 进入全屏
  useEffect(() => {
    if (isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen().catch(() => {
        setFullscreen(false)
      })
    }
  }, [isFullscreen])

  // 监听全屏变化
  useEffect(() => {
    const handleChange = () => {
      if (!document.fullscreenElement) {
        setFullscreen(false)
      }
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [setFullscreen])

  const handleClose = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
    // 清理 confetti canvas
    if (confettiCanvasRef.current && confettiCanvasRef.current.parentNode) {
      confettiCanvasRef.current.parentNode.removeChild(confettiCanvasRef.current)
      confettiCanvasRef.current = null
    }
    setFullscreen(false)
    setRunning(false)
  }, [setFullscreen, setRunning])

  const handleDrawAgain = useCallback(() => {
    setPhase('running')
    setCurrentIndex(0)
    setWinners([])
    setIsManualStopped(false)
  }, [])

  // 获取当前滚动图片
  const currentScrollImage = availableImages[currentIndex]

  if (availableImages.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">没有可抽奖的图片</p>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-white text-black rounded-lg"
          >
            关闭
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: settings.bgColor }}
    >
      {/* 模糊背景层 */}
      {settings.fitMode === 'blur-bg' && currentScrollImage && phase === 'running' && (
        <div
          className="absolute inset-0 blur-2xl scale-125 opacity-50"
          style={{ backgroundImage: `url(${currentScrollImage.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}
      {settings.fitMode === 'blur-bg' && winners.length > 0 && phase === 'result' && (
        <div
          className="absolute inset-0 blur-2xl scale-125 opacity-50"
          style={{ backgroundImage: `url(${winners[0].url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}
      {settings.fitMode === 'cover' && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: settings.bgColor }}
        />
      )}

      {/* 顶部控制栏 */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleClose}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white backdrop-blur-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* 抽奖区域 */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        {phase === 'running' ? (
          // 抽奖动画中
          <div className="text-center relative z-10">
            {currentScrollImage && (
              <div className="relative w-[90vw] h-[80vh] mx-auto overflow-hidden rounded-2xl bg-black/20 backdrop-blur-sm flex items-center justify-center">
                <img
                  src={currentScrollImage.url}
                  alt=""
                  className="max-w-full max-h-full object-contain transition-all duration-100"
                />
                <div className="absolute inset-0 border-4 border-white/30 rounded-2xl pointer-events-none" />
              </div>
            )}

            {settings.stopMode === 'manual' ? (
              <div className="mt-8">
                <button
                  onClick={handleManualStop}
                  className="px-12 py-4 text-xl font-bold text-rose-900 bg-white hover:bg-rose-50 rounded-xl shadow-lg transform transition-transform hover:scale-105"
                >
                  停止抽奖
                </button>
              </div>
            ) : null}

            <p className="text-white/60 mt-6 text-sm">
              按 Esc 退出{settings.stopMode === 'manual' ? ' | 点击按钮或按空格停止' : ' | 空格提前停止'}
            </p>
          </div>
        ) : (
          // 显示结果
          <div className="w-full max-w-[95vw] max-h-[90vh] flex flex-col relative z-10 py-6">
            <h2 className="text-4xl font-bold text-white drop-shadow-lg text-center shrink-0 mb-4">🎉 恭喜中奖！</h2>

            <div className="flex-1 overflow-y-auto flex flex-wrap justify-center items-start gap-4 px-4 py-2 content-start min-h-0">
              {winners.map((winner) => {
                const maxSize = winners.length === 1 ? 'max-w-[80vw] max-h-[60vh]' :
                                winners.length <= 4 ? 'max-w-[38vw] max-h-[45vh]' :
                                winners.length <= 9 ? 'max-w-[28vw] max-h-[35vh]' :
                                'max-w-[20vw] max-h-[25vh]'

                const imgMaxHeight = winners.length === 1 ? '60vh' :
                                     winners.length <= 4 ? '45vh' :
                                     winners.length <= 9 ? '35vh' :
                                     '25vh'

                return (
                  <div
                    key={winner.id}
                    className="relative flex flex-col items-center"
                  >
                    <div className={`rounded-2xl overflow-hidden bg-black/30 shadow-2xl backdrop-blur-sm flex items-center justify-center ${maxSize}`}>
                      <img
                        src={winner.url}
                        alt={winner.name}
                        className="max-w-full max-h-full object-contain"
                        style={{ maxHeight: imgMaxHeight }}
                      />
                    </div>
                    <div className="mt-2 text-white text-sm font-medium drop-shadow text-center px-2 truncate max-w-[200px]">
                      {winner.name}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-4 justify-center shrink-0 pt-4">
              <button
                onClick={handleDrawAgain}
                disabled={availableImages.length - winners.length < settings.winnerCount}
                className="px-8 py-3 text-white bg-white/20 hover:bg-white/30 rounded-xl font-medium backdrop-blur-sm
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                再抽一次 ({availableImages.length - winners.length} 张可选)
              </button>
              <button
                onClick={handleClose}
                className="px-8 py-3 text-rose-900 bg-white hover:bg-rose-50 rounded-xl font-medium shadow-lg"
              >
                完成
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
