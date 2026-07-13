/**
 * 图像加载与读取的统一工具，消除各处重复的 new Image() / FileReader 模板。
 */

/** 从 src（dataURL / ObjectURL）加载 HTMLImageElement */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** 读取文件，返回 dataURL 与原始宽高 */
export function readFileAsImage(
  file: File
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const img = new Image()
      img.onload = () => resolve({ dataUrl, width: img.width, height: img.height })
      img.onerror = reject
      img.src = dataUrl
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** 从 HTMLImageElement 取 ImageData（用于像素级处理，如透明区域检测） */
export function getImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, img.width, img.height)
}
