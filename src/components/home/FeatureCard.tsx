import { useNavigate } from 'react-router-dom'
import type { Feature } from '../../constants/features'

interface FeatureCardProps {
  feature: Feature
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(feature.path)}
      className="group cursor-pointer bg-white rounded-2xl p-6 shadow-sm border border-slate-100
                 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-slate-200"
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color}
                      flex items-center justify-center text-white
                      transition-transform duration-300 group-hover:scale-110`}
        >
          {feature.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-800">{feature.name}</h3>
            {feature.isNew && (
              <span
                className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700
                           rounded-full"
              >
                新功能
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">{feature.description}</p>
        </div>
        <div
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center
                     text-slate-400 transition-all duration-300
                     group-hover:bg-indigo-500 group-hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </div>
  )
}
