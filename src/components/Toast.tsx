import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'

export function Toast() {
  const toast = useAppStore((s) => s.toast)
  const hideToast = useAppStore((s) => s.hideToast)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast, hideToast])

  if (!toast) return null

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[toast.type]

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[toast.type]

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 ${bgColor} text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in`}
    >
      <span className="font-bold">{icon}</span>
      <span className="text-sm">{toast.message}</span>
    </div>
  )
}
