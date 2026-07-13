import { useState } from 'react'
import { useFrameFillStore } from '../../store/framefillStore'

export function RegionAssignPanel() {
  const template = useFrameFillStore((state) => state.template)
  const photos = useFrameFillStore((state) => state.photos)
  const selectedRegionId = useFrameFillStore((state) => state.selectedRegionId)
 const assignPhotoToRegion = useFrameFillStore((state) => state.assignPhotoToRegion)
 const selectRegion = useFrameFillStore((state) => state.selectRegion)
 const syncFromFirstRegion = useFrameFillStore((state) => state.syncFromFirstRegion)

  const [expandedRegionId, setExpandedRegionId] = useState<string | null>(null)

  if (!template) {
    return null
  }

  const getPhotoById = (photoId: string | null) => {
    if (!photoId) return null
    return photos.find((p) => p.id === photoId)
  }

 const handlePhotoSelect = (regionId: string, photoId: string | null) => {
   assignPhotoToRegion(regionId, photoId)
   setExpandedRegionId(null)
 }

 const canAutoAssign = photos.length >= template.regions.length
 const canSync =
   !!template.regions[0]?.photoId &&
   template.regions.slice(1).some((r) => r.photoId)

 return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-slate-700">区域分配</h3>
        <span className="text-xs text-slate-500">
          {template.regions.filter((r) => r.photoId).length} / {template.regions.length} 已分配
        </span>
      </div>

      {template.regions.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-4">
          未检测到透明区域，请检查模板图片
        </div>
      ) : (
        <div className="space-y-2">
          {template.regions.map((region, index) => {
            const assignedPhoto = getPhotoById(region.photoId)
            const isSelected = selectedRegionId === region.id
            const isExpanded = expandedRegionId === region.id

            return (
              <div key={region.id}>
                <div
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                  }`}
                  onClick={() => selectRegion(region.id)}
                >
                  {/* Region number */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      assignedPhoto
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Region size info */}
                  <div className="text-xs text-slate-500 flex-shrink-0">
                    {region.width}×{region.height}
                  </div>

                  {/* Assigned photo or select button */}
                  {assignedPhoto ? (
                    <div
                      className="flex-1 flex items-center gap-2 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedRegionId(isExpanded ? null : region.id)
                      }}
                    >
                      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 border border-slate-200">
                        <img
                          src={assignedPhoto.dataUrl}
                          alt={assignedPhoto.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-slate-600 truncate flex-1">
                        {assignedPhoto.name}
                      </span>
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedRegionId(isExpanded ? null : region.id)
                      }}
                      className={`flex-1 text-sm py-1.5 px-3 rounded border transition-colors ${
                        isExpanded
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-600'
                      }`}
                    >
                      {photos.length === 0 ? '请先上传图片' : '点击选择图片...'}
                    </button>
                  )}

                  {/* Clear button */}
                  {assignedPhoto && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePhotoSelect(region.id, null)
                      }}
                      className="w-6 h-6 rounded-full bg-slate-200 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center text-sm transition-colors flex-shrink-0"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Photo selection dropdown */}
                {isExpanded && photos.length > 0 && (
                  <div className="mt-1 ml-9 p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div className="grid grid-cols-4 gap-2">
                      {photos.map((photo) => {
                        const isThisAssigned = region.photoId === photo.id
                        return (
                          <button
                            key={photo.id}
                            onClick={() => handlePhotoSelect(region.id, photo.id)}
                            className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                              isThisAssigned
                                ? 'border-green-500 ring-2 ring-green-200'
                                : 'border-transparent hover:border-indigo-300'
                            }`}
                            title={photo.name}
                          >
                            <img
                              src={photo.dataUrl}
                              alt={photo.name}
                              className="w-full h-full object-cover"
                            />
                            {isThisAssigned && (
                              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-white drop-shadow"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

     {/* Quick actions */}
     {(canAutoAssign || canSync) && (
      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
        {canAutoAssign && (
         <button
           onClick={() => {
             // Auto-assign photos to regions
             template.regions.forEach((region, index) => {
               if (index < photos.length) {
                 assignPhotoToRegion(region.id, photos[index].id)
               }
             })
           }}
           className="w-full text-sm text-indigo-600 hover:text-indigo-700 py-1.5 rounded hover:bg-indigo-50 transition-colors"
         >
           自动按顺序分配
         </button>
        )}
       {canSync && (
           <button
             onClick={() => syncFromFirstRegion()}
             className="w-full text-sm text-emerald-600 hover:text-emerald-700 py-1.5 rounded hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-8 5h8M3 5l2 2-2 2M3 12l2 2-2 2M3 19l2 2-2 2" />
             </svg>
             同步首图缩放到所有区域
           </button>
         )}
       </div>
     )}
    </div>
  )
}
