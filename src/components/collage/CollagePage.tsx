import { DropZone } from '../DropZone'
import { FolderList } from '../FolderList'
import { WatermarkSettings } from '../WatermarkSettings'
import { BackgroundSettings } from '../BackgroundSettings'
import { PreviewCanvas } from '../PreviewCanvas'
import { ExportSettings } from '../ExportSettings'

export function CollagePage() {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          <DropZone />
          <FolderList />
          <PreviewCanvas />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ExportSettings />
          <BackgroundSettings />
          <WatermarkSettings />
        </div>
      </div>
    </div>
  )
}
