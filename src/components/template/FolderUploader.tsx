import { useCallback, useRef, useState } from 'react'
import { useTemplateStore } from '../../store/templateStore'

// Helper function to recursively read a directory entry
async function readDirectory(entry: FileSystemDirectoryEntry): Promise<File[]> {
  const files: File[] = []
  const reader = entry.createReader()

  const readAllEntries = (): Promise<FileSystemEntry[]> => {
    return new Promise((resolve) => {
      const allEntries: FileSystemEntry[] = []
      const readBatch = () => {
        reader.readEntries((entries) => {
          if (entries.length === 0) {
            resolve(allEntries)
          } else {
            allEntries.push(...entries)
            readBatch()
          }
        })
      }
      readBatch()
    })
  }

  const entries = await readAllEntries()

  for (const ent of entries) {
    if (ent.isFile) {
      const file = await new Promise<File>((resolve) => {
        (ent as FileSystemFileEntry).file(resolve)
      })
      if (file.type.startsWith('image/')) {
        files.push(file)
      }
    } else if (ent.isDirectory) {
      const subFiles = await readDirectory(ent as FileSystemDirectoryEntry)
      files.push(...subFiles)
    }
  }

  return files
}

export function FolderUploader() {
  const addFolder = useTemplateStore((state) => state.addFolder)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      const items = e.dataTransfer.items
      const folderMap = new Map<string, File[]>()

      // Process each dropped item
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const entry = item.webkitGetAsEntry?.()

        if (entry) {
          if (entry.isDirectory) {
            // It's a folder - read all files recursively
            const dirEntry = entry as FileSystemDirectoryEntry
            const files = await readDirectory(dirEntry)
            if (files.length > 0) {
              folderMap.set(entry.name, files)
            }
          } else if (entry.isFile) {
            // It's a single file
            const fileEntry = entry as FileSystemFileEntry
            const file = await new Promise<File>((resolve) => {
              fileEntry.file(resolve)
            })
            if (file.type.startsWith('image/')) {
              // Single files go to a "Dropped Files" folder
              if (!folderMap.has('Dropped Files')) {
                folderMap.set('Dropped Files', [])
              }
              folderMap.get('Dropped Files')!.push(file)
            }
          }
        }
      }

      // Add each folder as a separate entry
      const { addFolder } = useTemplateStore.getState()
      for (const [folderName, folderFiles] of folderMap) {
        // Sort files by name for consistent ordering
        folderFiles.sort((a, b) => a.name.localeCompare(b.name))
        await addFolder(folderFiles, folderName)
      }
    },
    [addFolder]
  )

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((file) =>
        file.type.startsWith('image/')
      )
      if (files.length === 0) {
        e.target.value = ''
        return
      }

      // Group files by their subfolder (second level directory)
      // When using webkitdirectory on a parent folder:
      // - "Parent/folder_A/photo1.jpg" → group as "folder_A"
      // - "folder/photo1.jpg" → group as "folder"
      const folderMap = new Map<string, File[]>()

      const getFolderName = (pathParts: string[]) => {
        if (pathParts.length > 2) {
          // Has subfolder: "Parent/subfolder/file.jpg" → "subfolder"
          return pathParts[1]
        } else if (pathParts.length > 1) {
          // Only top-level folder: "folder/file.jpg" → "folder"
          return pathParts[0]
        }
        return 'Root'
      }

      for (const file of files) {
        const pathParts = file.webkitRelativePath.split('/')
        const folderName = getFolderName(pathParts)

        if (!folderMap.has(folderName)) {
          folderMap.set(folderName, [])
        }
        folderMap.get(folderName)!.push(file)
      }

      // Add each folder as a separate entry
      const { addFolder } = useTemplateStore.getState()
      for (const [folderName, folderFiles] of folderMap) {
        // Sort files by name for consistent ordering
        folderFiles.sort((a, b) => a.name.localeCompare(b.name))
        await addFolder(folderFiles, folderName)
      }

      e.target.value = ''
    },
    [addFolder]
  )

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer bg-white ${
        isDragging
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-slate-300 hover:border-indigo-400'
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        // @ts-ignore - webkitdirectory is not in the type definition
        webkitdirectory=""
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-col items-center gap-2">
        <svg
          className="w-10 h-10 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <div className="text-sm text-slate-600">
          <span className="text-indigo-500 font-medium">点击选择父目录</span>
          <span className="text-slate-400 mx-1">或</span>
          <span className="text-indigo-500 font-medium">拖拽多个文件夹</span>
        </div>
        <div className="text-xs text-slate-400">选择包含子文件夹的父目录，自动识别每个子文件夹</div>
      </div>
    </div>
  )
}
