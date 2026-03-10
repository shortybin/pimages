import { useRef, useState } from 'react'
import { useSlideshowStore } from '../../store/slideshowStore'
import { AudioSelector } from './AudioSelector'

export function SlideshowSetup() {
  const images = useSlideshowStore((state) => state.images)
  const settings = useSlideshowStore((state) => state.settings)
  const addImages = useSlideshowStore((state) => state.addImages)
  const clearImages = useSlideshowStore((state) => state.clearImages)
  const removeImage = useSlideshowStore((state) => state.removeImage)
  const setSettings = useSlideshowStore((state) => state.setSettings)
  const play = useSlideshowStore((state) => state.play)

  const folderInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [nameFilter, setNameFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'folder' | 'manual'>('folder')

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files)
    const names = nameFilter
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0)

    addImages(fileArray, names.length > 0 ? names : undefined)

    // 重置 input
    if (folderInputRef.current) {
      folderInputRef.current.value = ''
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    addImages(Array.from(files))

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePlay = () => {
    if (images.length > 0) {
      play()
    }
  }

  return (
    <div className="space-y-6">
      {/* 选择图片 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <h3 className="text-sm font-medium text-slate-700">选择图片</h3>

        {/* Tab 切换 */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('folder')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              activeTab === 'folder'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            文件夹模式
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              activeTab === 'manual'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            手动选择
          </button>
        </div>

        {activeTab === 'folder' ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-slate-600 mb-1 block">文件名过滤（可选）</label>
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="如: final.jpg, preview.png（多个用逗号分隔）"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <input
                ref={folderInputRef}
                type="file"
                // @ts-expect-error webkitdirectory is not in types
                webkitdirectory=""
                multiple
                onChange={handleFolderSelect}
                className="hidden"
                id="folder-input"
              />
              <label
                htmlFor="folder-input"
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-sm text-slate-600">选择文件夹</span>
              </label>
            </div>
          </div>
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="text-sm text-slate-600">选择图片</span>
            </label>
          </div>
        )}

        {/* 已选图片列表 */}
        {images.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">已选择 {images.length} 张图片</span>
              <button
                onClick={clearImages}
                className="text-xs text-red-500 hover:text-red-600"
              >
                清空
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group w-16 h-16 rounded-lg overflow-hidden bg-slate-100"
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 图片适配 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-medium text-slate-700">图片适配</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'contain', label: '适应屏幕', desc: '完整显示' },
            { value: 'cover', label: '填充屏幕', desc: '裁剪填充' },
            { value: 'blur-bg', label: '模糊背景', desc: '沉浸效果' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setSettings({ fitMode: item.value as typeof settings.fitMode })}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                settings.fitMode === item.value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="font-medium">{item.label}</div>
              <div className="text-[10px] opacity-70">{item.desc}</div>
            </button>
          ))}
        </div>
        {settings.fitMode === 'contain' && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600">背景色：</label>
            <input
              type="color"
              value={settings.bgColor}
              onChange={(e) => setSettings({ bgColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 切换动画 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-medium text-slate-700">切换动画</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'fade', label: '淡入淡出' },
            { value: 'slide', label: '滑动' },
            { value: 'zoom', label: '缩放' },
            { value: 'flip', label: '翻转' },
            { value: 'rotate', label: '旋转' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setSettings({ transition: item.value as typeof settings.transition })}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                settings.transition === item.value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 信息显示 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-medium text-slate-700">信息显示</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'showFilename', label: '文件名' },
            { key: 'showIndex', label: '序号' },
            { key: 'showProgress', label: '进度条' },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings[item.key as keyof typeof settings] as boolean}
                onChange={(e) => setSettings({ [item.key]: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 播放设置 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-medium text-slate-700">播放设置</h3>

        <div className="flex items-center gap-4">
          <label className="text-sm text-slate-600">间隔时间：</label>
          <select
            value={settings.interval}
            onChange={(e) => setSettings({ interval: Number(e.target.value) })}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={3}>3 秒</option>
            <option value={5}>5 秒</option>
            <option value={10}>10 秒</option>
            <option value={15}>15 秒</option>
            <option value={30}>30 秒</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.loop}
              onChange={(e) => setSettings({ loop: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-600">循环播放</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.shuffle}
              onChange={(e) => setSettings({ shuffle: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-600">随机顺序</span>
          </label>
        </div>
      </div>

      {/* 背景音乐 */}
      <AudioSelector />

      {/* 开始播放按钮 */}
      <button
        onClick={handlePlay}
        disabled={images.length === 0}
        className="w-full py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600
                   rounded-xl hover:from-indigo-600 hover:to-purple-700
                   disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        开始播放 ({images.length} 张)
      </button>
    </div>
  )
}
