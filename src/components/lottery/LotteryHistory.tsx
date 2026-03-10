import { useState } from 'react'
import { useLotteryStore } from '../../store/lotteryStore'

interface Props {
  onClear: () => void
}

export function LotteryHistory({ onClear }: Props) {
  const winners = useLotteryStore((state) => state.winners)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  if (winners.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">中奖历史</h3>
        <div className="text-sm text-slate-400 text-center py-4">
          暂无中奖记录
        </div>
      </div>
    )
  }

  // 按抽奖批次分组
  const groups: { time: number; winners: typeof winners }[] = []
  let currentGroup: { time: number; winners: typeof winners } | null = null

  winners.forEach((winner) => {
    // 如果距离上一张超过5秒，认为是新的一批
    if (!currentGroup || winner.drawnAt - currentGroup.time > 5000) {
      currentGroup = { time: winner.drawnAt, winners: [winner] }
      groups.push(currentGroup)
    } else {
      currentGroup.winners.push(winner)
    }
  })

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-700">中奖历史</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">共 {winners.length} 张</span>
            <button
              onClick={onClear}
              className="text-xs text-red-500 hover:text-red-600"
            >
              清空
            </button>
          </div>
        </div>

        <div className="space-y-4 max-h-64 overflow-y-auto">
          {groups.map((group, gi) => (
            <div key={gi} className="space-y-2">
              <div className="text-xs text-slate-400">
                第 {groups.length - gi} 轮 · {new Date(group.time).toLocaleTimeString()}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.winners.map((winner) => (
                  <div
                    key={winner.id}
                    className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 group cursor-pointer"
                    onClick={() => setPreviewImage(winner.image.url)}
                  >
                    <img
                      src={winner.image.url}
                      alt={winner.image.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] text-center px-1 truncate">
                        {winner.image.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
