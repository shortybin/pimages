import { useEffect } from 'react'
import { useCutoutStore } from '../../store/cutoutStore'
import { ImageUpload } from './ImageUpload'
import { CutoutCanvas } from './CutoutCanvas'
import { ToolToolbar } from './ToolToolbar'

export function CutoutPage() {
  const image = useCutoutStore((state) => state.image)
  const clearAll = useCutoutStore((state) => state.clearAll)

  // 页面卸载时清理状态
  useEffect(() => {
    return () => {
      clearAll()
    }
  }, [clearAll])

  if (!image) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <ImageUpload />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Canvas Area */}
        <div className="md:col-span-3">
          <CutoutCanvas />
        </div>

        {/* Tools Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <ToolToolbar />

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="text-sm font-medium text-amber-800 mb-2">使用提示</h4>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• <strong>魔棒</strong>：点击颜色区域，相似颜色变透明</li>
              <li>• <strong>矩形</strong>：拖拽绘制区域，区域内变透明</li>
              <li>• <strong>手动画</strong>：自由绘制封闭区域变透明</li>
              <li>• 调整容差值可改变颜色匹配范围</li>
              <li>• 支持撤销和重置操作</li>
            </ul>
          </div>

          {/* Image Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">图片信息</h4>
            <div className="text-xs text-slate-500 space-y-1">
              <p>文件名：{image.name}</p>
              <p>
                尺寸：{image.width} × {image.height}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
