import { useCompressStore } from '../../store/compressStore'

export function CompressActions() {
  const compressAll = useCompressStore((state) => state.compressAll)
  const downloadAll = useCompressStore((state) => state.downloadAll)
  const clearAll = useCompressStore((state) => state.clearAll)
  const images = useCompressStore((state) => state.images)
  const isProcessing = useCompressStore((state) => state.isProcessing)

  const pendingCount = images.filter((img) => img.status === 'pending').length
  const completedCount = images.filter((img) => img.status === 'completed').length

  if (images.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {pendingCount > 0 && <span>待压缩: {pendingCount} 张</span>}
          {pendingCount > 0 && completedCount > 0 && <span className="mx-2">|</span>}
          {completedCount > 0 && <span>已完成: {completedCount} 张</span>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={compressAll}
            disabled={isProcessing || pendingCount === 0}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600
                       rounded-lg hover:from-amber-600 hover:to-orange-700
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? '压缩中...' : `压缩 (${pendingCount})`}
          </button>
          <button
            onClick={downloadAll}
            disabled={completedCount === 0}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100
                       rounded-lg hover:bg-slate-200
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            全部下载
          </button>
          <button
            onClick={clearAll}
            disabled={isProcessing}
            className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50
                       rounded-lg hover:bg-red-100
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            清空
          </button>
        </div>
      </div>
    </div>
  )
}
