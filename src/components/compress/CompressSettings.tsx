import { useCompressStore } from '../../store/compressStore'

export function CompressSettings() {
  const options = useCompressStore((state) => state.options)
  const setOptions = useCompressStore((state) => state.setOptions)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      <h3 className="text-sm font-medium text-slate-700">压缩设置</h3>

      {/* Lossless Toggle */}
      <div className="space-y-2">
        <label className="text-sm text-slate-600">压缩模式</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: false, label: '有损压缩', desc: '更小文件' },
            { value: true, label: '无损压缩', desc: '保持画质' },
          ].map((mode) => (
            <button
              key={String(mode.value)}
              onClick={() => setOptions({ lossless: mode.value })}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors
                ${
                  options.lossless === mode.value
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
            >
              <div className="font-medium">{mode.label}</div>
              <div className="text-[10px] opacity-70 mt-0.5">{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quality */}
      <div className="space-y-2">
        <label className="text-sm text-slate-600">压缩质量</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'high', label: '高', desc: '较高画质' },
            { value: 'medium', label: '中', desc: '平衡画质和大小' },
            { value: 'low', label: '低', desc: '最小文件大小' },
          ].map((q) => (
            <button
              key={q.value}
              onClick={() => setOptions({ quality: q.value as typeof options.quality })}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors
                ${
                  options.quality === q.value
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
            >
              <div className="font-medium">{q.label}</div>
              <div className="text-[10px] opacity-70 mt-0.5">{q.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Output Format */}
      <div className="space-y-2">
        <label className="text-sm text-slate-600">输出格式</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: 'original', label: '原格式' },
            { value: 'png', label: 'PNG' },
            { value: 'jpeg', label: 'JPEG' },
            { value: 'webp', label: 'WebP' },
          ].map((format) => (
            <button
              key={format.value}
              onClick={() => setOptions({ outputFormat: format.value as typeof options.outputFormat })}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors
                ${
                  options.outputFormat === format.value
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
            >
              {format.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h4 className="text-sm font-medium text-amber-800 mb-2">使用提示</h4>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• 选择压缩质量：高(5MB)、中(2MB)、低(0.5MB)</li>
          <li>• 选择"原格式"保持图片格式不变</li>
          <li>• 批量上传支持同时处理多张图片</li>
          <li>• 压缩完成后点击底部按钮批量下载</li>
        </ul>
      </div>
    </div>
  )
}
