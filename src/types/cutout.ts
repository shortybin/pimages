export type SelectionMode = 'rectangle' | 'magicWand' | 'freehand'

export interface CutoutImage {
  id: string
  name: string
  originalDataUrl: string
  processedDataUrl: string
  width: number
  height: number
}

export interface HistoryState {
  imageData: ImageData
}

export interface Point {
  x: number
  y: number
}
