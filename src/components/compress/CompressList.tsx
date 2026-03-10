import { useCompressStore } from '../../store/compressStore'
import { formatFileSize, calculateCompressionRatio } from '../../services/imageCompressor'

export function CompressList() {
  const images = useCompressStore((state) => state.images)
  const removeImage = useCompressStore((state) => state.removeImage)
  const downloadImage = useCompressStore((state) => state.downloadImage)
  const isProcessing = useCompressStore((state) => state.isProcessing)

  if (images.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-3 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-medium text-slate-700">图片列表 ({images.length})</h3>
      </div>
      <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
        {images.map((image) => (
          <div key={image.id} className="flex items-center gap-4 p-3 hover:bg-slate-50">
            {/* Preview */}
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
              {image.previewUrl ? (
                <img
                  src={image.previewUrl}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{image.name}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>{formatFileSize(image.originalSize)}</span>
                {image.status === 'completed' && image.compressedSize && (
                  <>
                    <span>→</span>
                    <span className="text-green-600 font-medium">
                      {formatFileSize(image.compressedSize)}
                    </span>
                    <span className="text-green-600 font-medium">
                      {calculateCompressionRatio(image.originalSize, image.compressedSize)}
                    </span>
                  </>
                )}
                {image.status === 'compressing' && (
                  <span className="text-amber-600">压缩中...</span>
                )}
                {image.status === 'error' && (
                  <span className="text-red-600">{image.error || '压缩失败'}</span>
                )}
              </div>
            </div>

            {/* Status Icon */}
            <div className="flex items-center gap-2">
              {image.status === 'compressing' && (
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              )}
              {image.status === 'completed' && (
                <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
              {image.status === 'error' && (
                <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Download button - only show when completed */}
              {image.status === 'completed' && (
                <button
                  onClick={() => downloadImage(image.id)}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="下载压缩后的图片"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              )}
              {/* Delete button */}
              <button
                onClick={() => removeImage(image.id)}
                disabled={isProcessing}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="删除"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
