# PhotoboothImages (pimages)

纯前端的图片处理工具箱，无需安装、浏览器直接使用，所有处理在本地完成，不上传服务器。

## 功能

- **图片拼贴**：多张图片自动布局拼贴，支持自定义背景、水印、导出格式
- **智能抠图**：魔棒 / 矩形 / 套索选区移除背景
- **图片压缩**：批量无损 / 有损压缩，支持格式转换
- **幻灯片播放**：从文件夹读取图片全屏播放，支持背景音乐、过渡效果，适合活动现场
- **图片抽奖**：从图片池随机抽奖，带动画效果
- **模板合成**：上传 PNG 模板，自动检测透明区域并批量合成照片
- **钥匙扣定制**：上传照片合成钥匙扣效果图，支持四角拖拽缩放、刻度尺、区域分配

## 技术栈

- React 19 + TypeScript
- Vite 7
- Zustand（状态管理）
- Tailwind CSS v4
- Canvas API（图像处理）

## 开发

```bash
npm install
npm run dev      # 启动开发服务器
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览构建产物
npm run lint     # 代码检查
```

> Vite 7 要求 Node.js 20.19+ 或 22.12+。

## 浏览器兼容

幻灯片播放的"读取文件夹"功能依赖 [File System Access API](https://developer.mozilla.org/docs/Web/API/File_System_Access_API)，建议使用 Chrome / Edge。其余功能在主流现代浏览器均可使用。

## 目录结构

```
src/
├── components/   各功能页面与组件（按模块分目录）
├── store/        Zustand 状态（按模块拆分）
├── services/     图像处理、布局引擎等领域逻辑
├── utils/        共享工具（id、download、imageLoader 等）
├── types/        类型定义
└── constants/    常量（功能列表等）
```
