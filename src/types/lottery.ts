export interface LotteryImage {
  id: string
  name: string
  url: string
  originalFile: File
}

export interface LotteryWinner {
  id: string
  image: LotteryImage
  drawnAt: number
}

export interface LotterySettings {
  // 中奖数量
  winnerCount: number

  // 动画效果（固定为滚动）
  animationType: 'scroll'

  // 动画速度
  animationSpeed: 'slow' | 'medium' | 'fast'

  // 不放回模式
  noRepeat: boolean

  // 停止模式：自动停止或手动停止
  stopMode: 'auto' | 'manual'

  // 自动停止的秒数（3-10秒）
  autoStopSeconds: number

  // 图片适配模式
  fitMode: 'contain' | 'cover' | 'blur-bg'

  // 背景颜色
  bgColor: string
}

export const defaultLotterySettings: LotterySettings = {
  winnerCount: 1,
  animationType: 'scroll',
  animationSpeed: 'medium',
  noRepeat: true,
  stopMode: 'auto',
  autoStopSeconds: 5,
  fitMode: 'blur-bg',
  bgColor: '#1e1b4b',
}
