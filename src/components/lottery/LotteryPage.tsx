import { useRef, useState } from 'react'
import { useLotteryStore } from '../../store/lotteryStore'
import { LotteryRunner } from './LotteryRunner'
import { LotteryHistory } from './LotteryHistory'
import { LotteryDrawnImages } from './LotteryDrawnImages'

export function LotteryPage() {
  const images = useLotteryStore((state) => state.images)
  const settings = useLotteryStore((state) => state.settings)
  const addImages = useLotteryStore((state) => state.addImages)
  const clearImages = useLotteryStore((state) => state.clearImages)
  const removeImage = useLotteryStore((state) => state.removeImage)
  const setSettings = useLotteryStore((state) => state.setSettings)
  const resetDrawn = useLotteryStore((state) => state.resetDrawn)
  const clearWinners = useLotteryStore((state) => state.clearWinners)
  const drawnIds = useLotteryStore((state) => state.drawnIds)
  const isRunning = useLotteryStore((state) => state.isRunning)
  const setRunning = useLotteryStore((state) => state.setRunning)
  const setFullscreen = useLotteryStore((state) => state.setFullscreen)

  const folderInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [nameFilter, setNameFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'folder' | 'manual'>('folder')

  // 可参与抽奖的图片
  const availableImages = settings.noRepeat
    ? images.filter(img => !drawnIds.includes(img.id))
    : images

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const names = nameFilter
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0)

    addImages(Array.from(files), names.length > 0 ? names : undefined)

    if (folderInputRef.current) {
      folderInputRef.current.value = ''
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    addImages(Array.from(files))

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleStartDraw = () => {
    if (availableImages.length >= settings.winnerCount) {
      setRunning(true)
    }
  }

  const handleFullscreenDraw = () => {
    if (availableImages.length >= settings.winnerCount) {
      setFullscreen(true)
      setRunning(true)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">图片抽奖</h1>
        <p className="text-sm text-slate-500 mt-1">从图片中随机抽取幸运儿</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧：设置和图片选择 */}
        <div className="md:col-span-2 space-y-6">
          {/* 选择图片 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <h3 className="text-sm font-medium text-slate-700">选择图片</h3>

            {/* Tab 切换 */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('folder')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  activeTab === 'folder'
                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                文件夹模式
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  activeTab === 'manual'
                    ? 'border-rose-500 bg-rose-50 text-rose-700'
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
                    placeholder="如: final.jpg（多个用逗号分隔）"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <input
                    ref={folderInputRef}
                    type="file"
                    webkitdirectory=""
                    multiple
                    onChange={handleFolderSelect}
                    className="hidden"
                    id="lottery-folder-input"
                  />
                  <label
                    htmlFor="lottery-folder-input"
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-colors"
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
                  id="lottery-file-input"
                />
                <label
                  htmlFor="lottery-file-input"
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-colors"
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
                      className="relative group w-20 h-20 rounded-lg overflow-hidden bg-slate-100"
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className={`w-full h-full object-cover ${
                          drawnIds.includes(img.id) ? 'opacity-40' : ''
                        }`}
                      />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ×
                      </button>
                      {drawnIds.includes(img.id) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[8px] bg-slate-600 text-white px-1 rounded">已抽</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 抽奖设置 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <h3 className="text-sm font-medium text-slate-700">抽奖设置</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* 中奖数量 */}
              <div>
                <label className="text-sm text-slate-600 mb-1 block">中奖数量</label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, availableImages.length)}
                  value={settings.winnerCount}
                  onChange={(e) => setSettings({ winnerCount: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* 动画速度 */}
              <div>
                <label className="text-sm text-slate-600 mb-1 block">动画速度</label>
                <select
                  value={settings.animationSpeed}
                  onChange={(e) => setSettings({ animationSpeed: e.target.value as typeof settings.animationSpeed })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="slow">慢</option>
                  <option value="medium">中</option>
                  <option value="fast">快</option>
                </select>
              </div>

              {/* 停止模式 */}
              <div>
                <label className="text-sm text-slate-600 mb-1 block">停止模式</label>
                <select
                  value={settings.stopMode}
                  onChange={(e) => setSettings({ stopMode: e.target.value as 'auto' | 'manual' })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="auto">定时停止</option>
                  <option value="manual">手动停止</option>
                </select>
              </div>

              {/* 自动停止秒数 */}
              {settings.stopMode === 'auto' && (
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">停止时间（秒）</label>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    value={settings.autoStopSeconds}
                    onChange={(e) => setSettings({ autoStopSeconds: Math.min(10, Math.max(3, Number(e.target.value))) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              {/* 不放回模式 */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.noRepeat}
                    onChange={(e) => setSettings({ noRepeat: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                  />
                  <span className="text-sm text-slate-600">不放回（抽过的不参与下次）</span>
                </label>
              </div>
            </div>
          </div>

          {/* 展示模式 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-medium text-slate-700">展示模式</h3>
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
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
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

          {/* 抽奖按钮 */}
          <div className="flex gap-4">
            <button
              onClick={handleStartDraw}
              disabled={availableImages.length < settings.winnerCount}
              className="flex-1 py-3 text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-pink-600
                         rounded-xl hover:from-rose-600 hover:to-pink-700
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              开始抽奖 ({availableImages.length} 张可选)
            </button>
            <button
              onClick={handleFullscreenDraw}
              disabled={availableImages.length < settings.winnerCount}
              className="px-6 py-3 text-sm font-medium text-rose-600 border-2 border-rose-500
                         rounded-xl hover:bg-rose-50
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              全屏抽奖
            </button>
          </div>
        </div>

        {/* 右侧：历史记录和已抽列表 */}
        <div className="space-y-6">
          {/* 中奖历史 */}
          <LotteryHistory onClear={clearWinners} />

          {/* 已抽过的图片 */}
          <LotteryDrawnImages onReset={resetDrawn} />
        </div>
      </div>

      {/* 抽奖执行组件 */}
      {isRunning && <LotteryRunner />}
    </div>
  )
}
