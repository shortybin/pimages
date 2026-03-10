export interface Feature {
  id: string
  name: string
  description: string
  path: string
  icon: React.ReactNode
  isNew?: boolean
  color: string
}

export const features: Feature[] = [
  {
    id: 'collage',
    name: '图片拼贴',
    description: '将多张图片拼贴成一张，支持自定义布局、背景和水印',
    path: '/collage',
    color: 'from-indigo-500 to-purple-600',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    id: 'cutout',
    name: '智能抠图',
    description: '使用魔棒或矩形选区，快速移除图片背景',
    path: '/cutout',
    color: 'from-emerald-500 to-teal-600',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    ),
  },
  {
    id: 'compress',
    name: '图片压缩',
    description: '无损压缩图片，减小文件体积同时保持画质',
    path: '/compress',
    color: 'from-amber-500 to-orange-600',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 14 10 14 10 20" />
        <polyline points="20 10 14 10 14 4" />
        <line x1="14" y1="10" x2="21" y2="3" />
        <line x1="3" y1="21" x2="10" y2="14" />
      </svg>
    ),
  },
  {
    id: 'slideshow',
    name: '幻灯片播放',
    description: '从文件夹提取图片并全屏播放，适合活动现场展示',
    path: '/slideshow',
    color: 'from-rose-500 to-pink-600',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    id: 'lottery',
    name: '图片抽奖',
    description: '从图片中随机抽取幸运儿，支持多种动画效果',
    path: '/lottery',
    color: 'from-cyan-500 to-blue-600',
    isNew: true,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: 'template',
    name: '模板合成',
    description: '上传 PNG 模板和照片，自动检测透明区域并合成',
    path: '/template',
    color: 'from-violet-500 to-purple-600',
    isNew: true,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    id: 'framefill',
    name: '钥匙扣定制',
    description: '上传照片合成钥匙扣效果图，可打印制作个性挂件',
    path: '/framefill',
    color: 'from-fuchsia-500 to-pink-600',
    isNew: true,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5" />
        <path d="M12 13v8" />
        <path d="M9 18l3 3 3-3" />
      </svg>
    ),
  },
]
