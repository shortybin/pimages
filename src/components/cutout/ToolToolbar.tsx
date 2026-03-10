import { useCutoutStore } from '../../store/cutoutStore'
import { NumericInput } from '../common/NumericInput'

export function ToolToolbar() {
  const {
    selectionMode,
    tolerance,
    setSelectionMode,
    setTolerance,
    undo,
    canUndo,
    reset,
    downloadImage,
    image,
    clearAll,
    // Rectangle controls
    rectX,
    rectY,
    rectWidth,
    rectHeight,
    setRectX,
    setRectY,
    setRectWidth,
    setRectHeight,
    applyRectCutout,
  } = useCutoutStore()

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      {/* Selection Mode */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">选择模式</label>
        <div className="flex flex-col gap-2">
          {/* First row: Magic Wand and Rectangle */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectionMode('magicWand')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg
                          transition-all duration-200 ${
                            selectionMode === 'magicWand'
                              ? 'bg-emerald-500 text-white shadow-md'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 4V2" />
                <path d="M15 16v-2" />
                <path d="M8 9h2" />
                <path d="M20 9h2" />
                <path d="M17.8 11.8 19 13" />
                <path d="M15 9h0" />
                <path d="M17.8 6.2 19 5" />
                <path d="m3 21 9-9" />
                <path d="M12.2 6.2 11 5" />
              </svg>
              <span className="text-sm font-medium">魔棒</span>
            </button>
            <button
              onClick={() => setSelectionMode('rectangle')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg
                          transition-all duration-200 ${
                            selectionMode === 'rectangle'
                              ? 'bg-indigo-500 text-white shadow-md'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              <span className="text-sm font-medium">矩形</span>
            </button>
          </div>
          {/* Second row: Freehand */}
          <button
            onClick={() => setSelectionMode('freehand')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg
                        transition-all duration-200 ${
                          selectionMode === 'freehand'
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            <span className="text-sm font-medium">手动画</span>
          </button>
        </div>
      </div>

      {/* Tolerance Slider - Only for magic wand */}
      {selectionMode === 'magicWand' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">容差值</label>
            <span className="text-sm text-slate-500 font-mono">{tolerance}</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={tolerance}
            onChange={(e) => setTolerance(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-md"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>精确</span>
            <span>宽松</span>
          </div>
        </div>
      )}

      {/* Rectangle Controls - Only for rectangle mode */}
      {selectionMode === 'rectangle' && image && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-700 mb-2">矩形控制</div>

          <NumericInput
            label="左距离 (X)"
            value={rectX}
            onChange={setRectX}
            min={0}
            max={image.width}
            unit="px"
          />

          <NumericInput
            label="顶部距离 (Y)"
            value={rectY}
            onChange={setRectY}
            min={0}
            max={image.height}
            unit="px"
          />

          <NumericInput
            label="宽度 (Width)"
            value={rectWidth}
            onChange={setRectWidth}
            min={1}
            max={image.width}
            unit="px"
          />

          <NumericInput
            label="高度 (Height)"
            value={rectHeight}
            onChange={setRectHeight}
            min={1}
            max={image.height}
            unit="px"
          />

          <button
            onClick={applyRectCutout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                       bg-indigo-500 text-white font-medium hover:bg-indigo-600
                       transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            <span>应用抠图</span>
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-slate-200" />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                      transition-all duration-200 ${
                        canUndo()
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                      }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
          <span className="text-sm font-medium">撤销</span>
        </button>
        <button
          onClick={reset}
          disabled={!image}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                      transition-all duration-200 ${
                        image
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                      }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span className="text-sm font-medium">重置</span>
        </button>
      </div>

      {/* Download Button */}
      <button
        onClick={downloadImage}
        disabled={!image}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                    font-medium transition-all duration-200 ${
                      image
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:shadow-lg'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>下载 PNG</span>
      </button>

      {/* Change Image Button */}
      <button
        onClick={clearAll}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                   bg-slate-100 text-slate-600 hover:bg-slate-200
                   transition-all duration-200"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24" />
          <path d="M21 3v6h-6" />
        </svg>
        <span>更换图片</span>
      </button>
    </div>
  )
}
