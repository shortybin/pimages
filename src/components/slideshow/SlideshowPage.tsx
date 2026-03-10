import { SlideshowSetup } from './SlideshowSetup'
import { SlideshowPlayer } from './SlideshowPlayer'

export function SlideshowPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">幻灯片播放</h1>
        <p className="text-sm text-slate-500 mt-1">选择图片文件夹，      </p>
      </div>

      {/* Settings */}
      <SlideshowSetup />

      {/* Player */}
      <SlideshowPlayer />
    </div>
  )
}
