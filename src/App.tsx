import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Header } from './components/common/Header'
import { HomePage } from './components/home/HomePage'
import { Toast } from './components/Toast'

// 路由级懒加载：各功能页拆成独立 chunk，降低首屏体积
const CollagePage = lazy(() => import('./components/collage/CollagePage').then(m => ({ default: m.CollagePage })))
const CutoutPage = lazy(() => import('./components/cutout/CutoutPage').then(m => ({ default: m.CutoutPage })))
const CompressPage = lazy(() => import('./components/compress/CompressPage').then(m => ({ default: m.CompressPage })))
const SlideshowPage = lazy(() => import('./components/slideshow/SlideshowPage').then(m => ({ default: m.SlideshowPage })))
const LotteryPage = lazy(() => import('./components/lottery/LotteryPage').then(m => ({ default: m.LotteryPage })))
const TemplateComposer = lazy(() => import('./components/template/TemplateComposer').then(m => ({ default: m.TemplateComposer })))
const FrameFillPage = lazy(() => import('./components/framefill/FrameFillPage').then(m => ({ default: m.FrameFillPage })))

function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header />

      <main className="flex-1">
        <Suspense fallback={<div className="flex items-center justify-center py-20 text-slate-400">加载中...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/collage" element={<CollagePage />} />
          <Route path="/cutout" element={<CutoutPage />} />
          <Route path="/compress" element={<CompressPage />} />
          <Route path="/slideshow" element={<SlideshowPage />} />
          <Route path="/lottery" element={<LotteryPage />} />
          <Route path="/template" element={<TemplateComposer />} />
          <Route path="/framefill" element={<FrameFillPage />} />
        </Routes>
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          {/* 打赏区域 */}
          <div className="text-center mb-6">
            <p className="text-sm text-slate-600 mb-5">觉得好用？请作者喝杯咖啡 ☕</p>
            <div className="flex flex-wrap justify-center items-end gap-4 sm:gap-6">
              {/* 微信收款码 */}
              <div className="group">
                <div
                  className="p-3 bg-white rounded-xl shadow-sm border border-slate-100
                                transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1"
                >
                  <img src="/images/wx.jpg" alt="微信打赏" className="w-28 h-auto rounded-lg" />
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">微信</p>
              </div>
              {/* 支付宝收款码 */}
              <div className="group">
                <div
                  className="p-3 bg-white rounded-xl shadow-sm border border-slate-100
                                transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1"
                >
                  <img src="/images/zfb.jpg" alt="支付宝打赏" className="w-28 h-auto rounded-lg" />
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">支付宝</p>
              </div>
            </div>
          </div>
          {/* 原有文字 */}
          <p className="text-center text-sm text-slate-500">PhotoboothImages - 纯前端图片处理工具箱</p>
        </div>
      </footer>

      <Toast />
    </div>
  )
}

export default App
