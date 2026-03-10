import { useLocation, useNavigate } from 'react-router-dom'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/collage':
        return '图片拼贴'
      case '/cutout':
        return '智能抠图'
      case '/compress':
        return '图片压缩'
      case '/slideshow':
        return '幻灯片播放'
      case '/lottery':
        return '图片抽奖'
      default:
        return 'PhotoboothImages'
    }
  }

  const getPageSubtitle = () => {
    switch (location.pathname) {
      case '/collage':
        return '图片拼贴工具'
      case '/cutout':
        return '智能抠图工具'
      case '/compress':
        return '图片压缩工具'
      case '/slideshow':
        return '幻灯片播放工具'
      case '/lottery':
        return '图片抽奖工具'
      default:
        return 'Photobooth图片处理工具箱'
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          {!isHome && (
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200
                         flex items-center justify-center text-slate-600
                         transition-colors duration-200"
              title="返回首页"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Logo */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center
                        bg-gradient-to-br from-indigo-500 to-purple-600
                        ${isHome ? 'cursor-default' : 'cursor-pointer'}`}
            onClick={() => !isHome && navigate('/')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-xl font-bold text-slate-800">{getPageTitle()}</h1>
            <p className="text-xs text-slate-500">{getPageSubtitle()}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
