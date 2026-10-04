/**
 * 进度条 —— 通用零件
 * ═══════════════════════════════════════════════════════════
 * 组件层铁矩：只负责画。不认识 store、不认识 repo。
 * 数据从 props 来，改动通过回调上报。
 *
 * ★ 视觉：填充条自带一层柔光，让它在星空上「亮」起来。
 */

interface Props {
  /** 0..1 */
  value: number
  /** 更细的样式（用于次要位置） */
  thin?: boolean
  /** 覆盖颜色（默认用点缀色） */
  color?: string
}

export function ProgressBar({ value, thin, color }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  const fill = color ?? 'var(--color-accent)'

  return (
    <div
      className="relative w-full overflow-hidden rounded-sm bg-white/8"
      style={{ height: thin ? 2 : 3 }}
    >
      <i
        className="block h-full rounded-sm transition-[width] duration-700"
        style={{
          width: `${pct}%`,
          background: fill,
          boxShadow: `0 0 8px ${color ?? 'var(--accent-dim)'}`,
        }}
      />
    </div>
  )
}
