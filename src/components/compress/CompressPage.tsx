import { CompressDropZone } from './CompressDropZone'
import { CompressList } from './CompressList'
import { CompressSettings } from './CompressSettings'
import { CompressActions } from './CompressActions'

export function CompressPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">图片压缩</h1>
        <p className="text-sm text-slate-500 mt-1">无损压缩图片，减小文件体积同时保持画质</p>
      </div>

      {/* Upload Zone and Settings - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Drop Zone - Left Side */}
        <div className="lg:col-span-3">
          <CompressDropZone />
        </div>

        {/* Settings - Right Side */}
        <div className="lg:col-span-2">
          <CompressSettings />
        </div>
      </div>

      {/* Image List - Full Width */}
      <div className="mb-6">
        <CompressList />
      </div>

      {/* Action Buttons - Bottom */}
      <CompressActions />
    </div>
  )
}
