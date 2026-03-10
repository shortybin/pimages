export interface SlideshowImage {
  id: string
  name: string
  url: string
  originalFile: File
}

export interface SlideshowAudio {
  id: string
  name: string
  url: string
  originalFile: File
  duration: number  // 秒
}

export interface AudioSettings {
  enabled: boolean      // 是否启用背景音乐
  volume: number        // 音量 0-1
  loop: boolean         // 循环播放
  fadeIn: number        // 淡入时长 ms
  fadeOut: number       // 淡出时长 ms
}

export interface SlideshowSettings {
  // 图片适配
  fitMode: 'contain' | 'cover' | 'blur-bg'
  bgColor: string

  // 切换动画
  transition: 'fade' | 'slide' | 'zoom' | 'flip' | 'rotate' | 'random'
  transitionDuration: number

  // 显示效果
  effect: 'none' | 'kenburns' | 'vignette' | 'polaroid' | 'film'

  // 信息显示
  showFilename: boolean
  showIndex: boolean
  showProgress: boolean

  // 播放控制
  interval: number
  loop: boolean
  shuffle: boolean

  // 音频设置
  audio: AudioSettings
}

export const defaultAudioSettings: AudioSettings = {
  enabled: false,
  volume: 0.7,
  loop: true,
  fadeIn: 1000,
  fadeOut: 1000,
}

export const defaultSettings: SlideshowSettings = {
  fitMode: 'blur-bg',
  bgColor: '#000000',

  transition: 'fade',
  transitionDuration: 500,

  effect: 'none',

  showFilename: false,
  showIndex: true,
  showProgress: true,

  interval: 5,
  loop: true,
  shuffle: false,

  audio: defaultAudioSettings,
}
