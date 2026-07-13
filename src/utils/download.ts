/**
 * 触发浏览器下载。
 * 支持 Blob（压缩/打包产物）和 dataURL（canvas.toDataURL 结果）两种来源。
 * 对 Blob 创建的 Object URL 会在下载触发后回收，避免内存泄漏。
 */
export function download(source: Blob | string, filename: string): void {
  const isDataUrl = typeof source === 'string'
  const url = isDataUrl ? source : URL.createObjectURL(source as Blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // 仅回收自己创建的 Object URL；dataURL 无需回收
  if (!isDataUrl) {
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }
}
