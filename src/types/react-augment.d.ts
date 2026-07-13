/* eslint-disable @typescript-eslint/no-unused-vars */
// 允许 <input webkitdirectory=""> 选择整个文件夹（非标准属性，主流浏览器支持）
import 'react'
declare module 'react' {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string
  }
}
