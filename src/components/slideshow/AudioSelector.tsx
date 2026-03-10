import { useRef } from 'react'
import { useSlideshowStore } from '../../store/slideshowStore'

// 格式化时长显示
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function AudioSelector() {
  const audioTracks = useSlideshowStore((state) => state.audioTracks)
  const audioSettings = useSlideshowStore((state) => state.settings.audio)
  const addAudioTracks = useSlideshowStore((state) => state.addAudioTracks)
  const removeAudioTrack = useSlideshowStore((state) => state.removeAudioTrack)
  const clearAudioTracks = useSlideshowStore((state) => state.clearAudioTracks)
  const setAudioSettings = useSlideshowStore((state) => state.setAudioSettings)

  const audioInputRef = useRef<HTMLInputElement>(null)

  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    await addAudioTracks(Array.from(files))

    // 重置 input
    if (audioInputRef.current) {
      audioInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">背景音乐</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={audioSettings.enabled}
            onChange={(e) => setAudioSettings({ enabled: e.target.checked })}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-600">启用</span>
        </label>
      </div>

      {/* 选择音频文件 */}
      <div>
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
          multiple
          onChange={handleAudioSelect}
          className="hidden"
          id="audio-input"
        />
        <label
          htmlFor="audio-input"
          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span className="text-sm text-slate-600">选择音频文件</span>
        </label>
        <p className="text-xs text-slate-400 mt-1">
          支持 MP3, WAV, OGG, M4A 格式
        </p>
      </div>

      {/* 已添加曲目列表 */}
      {audioTracks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">已添加曲目 ({audioTracks.length})</span>
            <button
              onClick={clearAudioTracks}
              className="text-xs text-red-500 hover:text-red-600"
            >
              清空
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {audioTracks.map((track, index) => (
              <div
                key={track.id}
                className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg group"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs text-slate-400">{index + 1}.</span>
                  <span className="text-sm text-slate-700 truncate">{track.name}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {formatDuration(track.duration)}
                  </span>
                </div>
                <button
                  onClick={() => removeAudioTrack(track.id)}
                  className="ml-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 音量控制 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-600">音量</label>
          <span className="text-sm text-slate-500">{Math.round(audioSettings.volume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={audioSettings.volume}
          onChange={(e) => setAudioSettings({ volume: parseFloat(e.target.value) })}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      {/* 循环播放 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={audioSettings.loop}
          onChange={(e) => setAudioSettings({ loop: e.target.checked })}
          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
        />
        <span className="text-sm text-slate-600">循环播放列表</span>
      </label>
    </div>
  )
}
