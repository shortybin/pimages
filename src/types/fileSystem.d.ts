// File System Access API type extensions
interface FileSystemFileHandle extends FileSystemHandle {
  getFile(): Promise<File>
}

interface FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>
  keys(): AsyncIterableIterator<string>
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
}
