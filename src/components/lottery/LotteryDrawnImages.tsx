import { useState } from 'react'
import { useLotteryStore } from '../../store/lotteryStore'

interface Props {
  onReset: () => void
}

export function LotteryDrawnImages({ onReset }: Props) {
  const images = useLotteryStore((state) => state.images)
  const drawnIds = useLotteryStore((state) => state.drawnIds)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const drawnImages = images.filter(img => drawnIds.includes(img.id))

  if (drawnImages.length === 0) {
    return null
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-700">已抽过的图片</h3>
          <button
            onClick={onReset}
            className="text-xs text-red-500 hover:text-red-600"
          >
            重置
          </button>
        </div>

        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {drawnImages.map((img) => (
            <div
              key={img.id}
              className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 opacity-60 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setPreviewImage(img.url)}
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-full object-cover grayscale"
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 mt-2">
          共 {drawnImages.length} 张已抽过（点击查看大图）
        </p>
      </div>

      {/* 图片预览弹窗 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
