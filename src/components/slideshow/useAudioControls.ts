import { useCallback } from 'react'
import { useSlideshowStore } from '../../store/slideshowStore'

// 音频控制 hook - 用于快捷键
export function useAudioControls() {
  const audioSettings = useSlideshowStore((state) => state.settings.audio)
  const setAudioSettings = useSlideshowStore((state) => state.setAudioSettings)

  const toggleMute = useCallback(() => {
    // 如果当前音量大于0，保存当前音量并静音；如果已经静音，恢复之前的音量
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
