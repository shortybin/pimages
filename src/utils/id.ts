/**
 * 生成唯一 ID：时间戳前缀 + 随机串，碰撞概率极低。
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}
