import { useEffect, useRef, useCallback } from 'react'
import { useSlideshowStore } from '../../store/slideshowStore'

export function AudioPlayer() {
  const audioTracks = useSlideshowStore((state) => state.audioTracks)
  const audioSettings = useSlideshowStore((state) => state.settings.audio)
  const currentAudioIndex = useSlideshowStore((state) => state.currentAudioIndex)
  const isPlaying = useSlideshowStore((state) => state.isPlaying)
  const isPaused = useSlideshowStore((state) => state.isPaused)
  const nextAudio = useSlideshowStore((state) => state.nextAudio)
  const setCurrentAudioIndex = useSlideshowStore((state) => state.setCurrentAudioIndex)

  const audioRef = useRef<HTMLAudioElement>(null)
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isPlayingRef = useRef(false)

  // 淡入效果
  const fadeIn = useCallback((audio: HTMLAudioElement, duration: number, targetVolume: number) => {
    // 清除之前的淡入淡出
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
    }

    audio.volume = 0
    const steps = 20
    const stepTime = duration / steps
    const volumeStep = targetVolume / steps
    let currentStep = 0

    fadeIntervalRef.current = setInterval(() => {
      currentStep++
      audio.volume = Math.min(currentStep * volumeStep, targetVolume)
      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }
      }
    }, stepTime)
  }, [])

  // 淡出效果
  const fadeOut = useCallback((audio: HTMLAudioElement, duration: number, callback?: () => void) => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
    }

    const startVolume = audio.volume
    const steps = 20
    const stepTime = duration / steps
    const volumeStep = startVolume / steps
    let currentStep = 0

    fadeIntervalRef.current = setInterval(() => {
      currentStep++
      audio.volume = Math.max(startVolume - currentStep * volumeStep, 0)
      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }
        callback?.()
      }
    }, stepTime)
  }, [])

  // 开始播放音频
  const startAudio = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audioSettings.enabled) return

    // 没有上传音乐时不播放
    if (audioTracks.length === 0) return

    const audioUrl = audioTracks[currentAudioIndex]?.url
    if (!audioUrl) return

    audio.src = audioUrl
    audio.load()

    const handleCanPlay = () => {
      audio.play()
        .then(() => {
          isPlayingRef.current = true
          fadeIn(audio, audioSettings.fadeIn, audioSettings.volume)
        })
        .catch(() => {
          // 自动播放可能被阻止
        })
      audio.removeEventListener('canplay', handleCanPlay)
    }

    audio.addEventListener('canplay', handleCanPlay)
  }, [audioTracks, currentAudioIndex, audioSettings.enabled, audioSettings.fadeIn, audioSettings.volume, fadeIn])

  // 停止音频
  const stopAudio = useCallback((resetIndex = true) => {
    const audio = audioRef.current
    if (!audio) return

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
      fadeIntervalRef.current = null
    }

    fadeOut(audio, audioSettings.fadeOut, () => {
      audio.pause()
      audio.currentTime = 0
      audio.src = ''
      isPlayingRef.current = false
      if (resetIndex) {
        setCurrentAudioIndex(0)
      }
    })
  }, [audioSettings.fadeOut, fadeOut, setCurrentAudioIndex])

  // 暂停音频
  const pauseAudio = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    fadeOut(audio, 200, () => {
      audio.pause()
    })
  }, [fadeOut])

  // 恢复音频
  const resumeAudio = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.play()
      .then(() => {
        fadeIn(audio, 200, audioSettings.volume)
      })
      .catch(() => {})
  }, [audioSettings.volume, fadeIn])

  // 监听播放状态
  useEffect(() => {
    if (isPlaying && !isPaused) {
      if (!isPlayingRef.current) {
        startAudio()
      } else {
        resumeAudio()
      }
    } else if (isPlaying && isPaused) {
      pauseAudio()
    } else if (!isPlaying) {
      stopAudio()
    }
  }, [isPlaying, isPaused, startAudio, pauseAudio, resumeAudio, stopAudio])

  // 监听音量变化
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !isPlayingRef.current) return

    // 直接设置音量（不在淡入淡出过程中时）
    if (!fadeIntervalRef.current) {
      audio.volume = audioSettings.volume
    }
  }, [audioSettings.volume])

  // 监听当前曲目索引变化（切换曲目）
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !isPlaying || !audioSettings.enabled) return

    // 没有上传音乐时不切换曲目
    if (audioTracks.length === 0) return

    const currentTrack = audioTracks[currentAudioIndex]
    if (currentTrack && audio.src !== currentTrack.url) {
      // 淡出当前曲目，播放下一首
      fadeOut(audio, 300, () => {
        audio.src = currentTrack.url
        audio.load()
        audio.play()
          .then(() => {
            fadeIn(audio, audioSettings.fadeIn, audioSettings.volume)
          })
          .catch(() => {})
      })
    }
  }, [currentAudioIndex, audioTracks, isPlaying, audioSettings.enabled, audioSettings.fadeIn, audioSettings.volume, fadeIn, fadeOut])

  // 曲目结束处理
  const handleEnded = useCallback(() => {
    // 没有上传音乐时不处理
    if (audioTracks.length === 0) return

    if (audioSettings.loop || currentAudioIndex < audioTracks.length - 1) {
      nextAudio()
    } else {
      // 最后一首且不循环，停止
      isPlayingRef.current = false
    }
  }, [audioSettings.loop, currentAudioIndex, audioTracks.length, nextAudio])

  // 清理
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  // 只需要启用音频设置即可渲染
  if (!audioSettings.enabled) {
    return null
  }

  return (
    <audio
      ref={audioRef}
      onEnded={handleEnded}
      preload="auto"
    />
  )
}

// 音频控制 hook - 用于快捷键
export function useAudioControls() {
  const audioSettings = useSlideshowStore((state) => state.settings.audio)
  const setAudioSettings = useSlideshowStore((state) => state.setAudioSettings)

  const toggleMute = useCallback(() => {
    // 如果当前音量大于0，保存当前音量并静音
    // 如果已经静音，恢复之前的音量
    if (audioSettings.volume > 0) {
      setAudioSettings({ volume: 0 })
    } else {
      setAudioSettings({ volume: 0.7 })
    }
  }, [audioSettings.volume, setAudioSettings])

  const increaseVolume = useCallback(() => {
    setAudioSettings({ volume: Math.min(1, audioSettings.volume + 0.1) })
  }, [audioSettings.volume, setAudioSettings])

  const decreaseVolume = useCallback(() => {
    setAudioSettings({ volume: Math.max(0, audioSettings.volume - 0.1) })
  }, [audioSettings.volume, setAudioSettings])

  return {
    toggleMute,
    increaseVolume,
    decreaseVolume,
    isMuted: audioSettings.volume === 0,
    volume: audioSettings.volume,
  }
}
