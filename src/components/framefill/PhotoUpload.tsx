import { useCallback } from 'react'
import { useFrameFillStore } from '../../store/framefillStore'

export function PhotoUpload() {
  const photos = useFrameFillStore((state) => state.photos)
  const addPhotos = useFrameFillStore((state) => state.addPhotos)
  const removePhoto = useFrameFillStore((state) => state.removePhoto)
  const clearPhotos = useFrameFillStore((state) => state.clearPhotos)

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      )
      if (files.length > 0) {
        await addPhotos(files)
      }
    },
    [addPhotos]
  )

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((file) =>
        file.type.startsWith('image/')
      )
      if (files.length > 0) {
        await addPhotos(files)
      }
      e.target.value = ''
    },
    [addPhotos]
  )

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-slate-700">
          填充图片 {photos.length > 0 && `(${photos.length})`}
        </h3>
        {photos.length > 0 && (
          <button
            onClick={clearPhotos}
            className="text-sm text-red-500 hover:text-red-600"
          >
            清空
          </button>
        )}
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden group"
            >
              <img
                src={photo.dataUrl}
                alt={photo.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-indigo-300 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('photo-upload')?.click()}
      >
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleChange}
        />
        <div className="flex flex-col items-center gap-1">
          <svg
            className="w-6 h-6 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <div className="text-xs text-slate-500">
            <span className="text-indigo-500">添加</span> 填充图片
          </div>
        </div>
      </div>
    </div>
  )
}
