/**
 * 环形进度 —— 通用零件
 * ═══════════════════════════════════════════════════════════
 * 用 SVG 画。周长 = 2πr，通过 strokeDashoffset 控制进度。
 *
 * ★ 视觉：双层环 —— 一层柔光晕（宽、模糊），一层实线（细、亮）。
 *   这样在深空背景上也有「发光仪表」的质感。
 */

interface Props {
  /** 0..1 */
  value: number
  /** 直径（px），默认自适应 */
  size?: number
  /** 环的粗细 */
  stroke?: number
  /** 中间显示的文字，不传则显示百分比 */
  label?: string
}

export function GoalRing({ value, size, stroke = 4, label }: Props) {
  const pct = Math.max(0, Math.min(1, value))
  const r = 86
  const circumference = 2 * Math.PI * r // ≈ 540.35
  const offset = circumference * (1 - pct)

  return (
    <div
      className="relative"
      style={{ width: size ?? 'clamp(120px,15vw,190px)', aspectRatio: '1' }}
    >
      <svg viewBox="0 0 200 200" className="size-full -rotate-90">
        {/* 底环 */}
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,.09)"
          strokeWidth={stroke}
        />
        {/* ★ 柔光晕层：粗而模糊，制造辉光 */}
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={stroke * 3.5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s var(--ease)',
            opacity: 0.22,
            filter: 'blur(6px)',
          }}
        />
        {/* 实线层 */}
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s var(--ease)',
            filter: 'drop-shadow(0 0 6px var(--accent-dim))',
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-mono text-[clamp(20px,2.6vw,32px)]">
          {label ?? (
            <>
              {Math.round(pct * 100)}
              <small className="ml-0.5 text-[0.45em] text-white/55">%</small>
            </>
          )}
        </span>
      </div>
    </div>
  )
}
