import { useAppStore } from '../store/appStore'

const positions = [
  { value: 1, label: '左上' },
  { value: 2, label: '中上' },
  { value: 3, label: '右上' },
  { value: 4, label: '左中' },
  { value: 5, label: '居中' },
  { value: 6, label: '右中' },
  { value: 7, label: '左下' },
  { value: 8, label: '中下' },
  { value: 9, label: '右下' },
]

export function WatermarkSettings() {
  const watermark = useAppStore((s) => s.watermark)
  const updateWatermark = useAppStore((s) => s.updateWatermark)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={watermark.enabled}
            onChange={(e) => updateWatermark({ enabled: e.target.checked })}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-slate-700">启用水印</span>
        </label>
      </div>

      {watermark.enabled && (
        <div className="p-4 space-y-4">
          {/* Mode selector */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">水印模式</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateWatermark({ mode: 'single' })}
                className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                  watermark.mode === 'single'
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                单水印
              </button>
              <button
                onClick={() => updateWatermark({ mode: 'tile' })}
                className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                  watermark.mode === 'tile'
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                平铺水印
              </button>
            </div>
          </div>

          {/* Position grid for single mode */}
          {watermark.mode === 'single' && (
            <div>
              <label className="block text-sm text-slate-700 mb-2">位置</label>
              <div className="grid grid-cols-3 gap-2">
                {positions.map((pos) => (
                  <button
                    key={pos.value}
                    onClick={() => updateWatermark({ position: pos.value })}
                    className={`px-2 py-2 text-xs rounded-lg border transition-colors ${
                      watermark.position === pos.value
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tile settings */}
          {watermark.mode === 'tile' && (
            <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
              <div>
                <label className="block text-sm text-slate-700 mb-2">水印间距</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={watermark.tileSpacing}
                    onChange={(e) => updateWatermark({ tileSpacing: Number(e.target.value) })}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-sm text-slate-500 w-14 text-right">{watermark.tileSpacing}px</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-2">旋转角度</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    step="5"
                    value={watermark.tileRotation}
                    onChange={(e) => updateWatermark({ tileRotation: Number(e.target.value) })}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-sm text-slate-500 w-14 text-right">{watermark.tileRotation}°</span>
                </div>
              </div>
            </div>
          )}

          <hr className="border-slate-200" />

          {/* Common settings */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">水印文字</label>
            <input
              type="text"
              value={watermark.text}
              onChange={(e) => updateWatermark({ text: e.target.value })}
              placeholder="输入水印文字"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-2">字体大小</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="12"
                max="72"
                value={watermark.fontSize}
                onChange={(e) => updateWatermark({ fontSize: Number(e.target.value) })}
                className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-sm text-slate-500 w-14 text-right">{watermark.fontSize}px</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-2">颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={watermark.color}
                onChange={(e) => updateWatermark({ color: e.target.value })}
                className="w-10 h-10 border-2 border-slate-200 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={watermark.color}
                onChange={(e) => updateWatermark({ color: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-2">透明度</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={watermark.opacity}
                onChange={(e) => updateWatermark({ opacity: Number(e.target.value) })}
                className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-sm text-slate-500 w-14 text-right">{watermark.opacity}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
