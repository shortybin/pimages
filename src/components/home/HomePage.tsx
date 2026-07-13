import { features } from '../../constants/features'
import { FeatureCard } from './FeatureCard'

export function HomePage() {
  return (
    <div className="flex flex-col items-center py-10 sm:py-12">
      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-12 px-4">
        <div
          className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl
                      bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 sm:mb-6"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="sm:w-10 sm:h-10">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 mb-2 sm:mb-3">PhotoboothImages 工具箱</h1>
        <p className="text-base sm:text-lg text-slate-500 max-w-md mx-auto">
          简单好用的在线图片处理工具，无需安装，浏览器直接使用
        </p>
      </div>

      {/* Feature Cards: 移动单列，md 以上两列 */}
      <div className="w-full max-w-4xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </div>
  )
}
