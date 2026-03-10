import { useAppStore } from '../store/appStore'
import { backgroundPresets } from '../services/layoutEngine'

function getPresetStyle(preset: typeof backgroundPresets[0]) {
  if (preset.isGradient) {
    return `linear-gradient(135deg, rgb(${preset.startColor.join(',')}) 0%, rgb(${preset.endColor.join(',')}) 100%)`
  }
  return `rgb(${preset.startColor.join(',')})`
}

export function BackgroundSettings() {
  const background = useAppStore((s) => s.background)
  const updateBackground = useAppStore((s) => s.updateBackground)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <span className="text-sm font-medium text-slate-700">背景颜色</span>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {backgroundPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => updateBackground({ preset: preset.name })}
              className={`aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                background.preset === preset.name
                  ? 'border-indigo-500 scale-105 shadow-lg shadow-indigo-200'
                  : 'border-transparent'
              }`}
              style={{ background: getPresetStyle(preset) }}
              title={preset.name}
            >
              <span className="sr-only">{preset.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-500">
          当前：<span className="font-medium text-indigo-600">{background.preset}</span>
        </div>
      </div>
    </div>
  )
}
