/**
 * 面板 —— 通用零件
 * ═══════════════════════════════════════════════════════════
 * 磨砂面板的统一封装。让九个模块的观感一致。
 *
 * ★ 视觉：四角有极细的「框角」装饰线 —— 这是舰桥仪表盘的框架语言。
 *   用纯 CSS 伪元素式实现（绝对定位的小边框），不引入额外图片。
 */

import type { ReactNode } from 'react'

interface Props {
  title?: string
  /** 右上角的小标记（比如百分比） */
  tag?: ReactNode
  children: ReactNode
  /** 撑满高度并让内容可滚动 */
  fill?: boolean
  className?: string
}

export function Panel({ title, tag, children, fill, className }: Props) {
  return (
    <section className={`glass relative flex min-h-0 flex-col ${className ?? ''}`}>
      {/* ★ 四角框角 —— 舰桥仪表的框架语言 */}
      <Corner className="top-0 left-0 border-t border-l" />
      <Corner className="top-0 right-0 border-t border-r" />
      <Corner className="bottom-0 left-0 border-b border-l" />
      <Corner className="bottom-0 right-0 border-b border-r" />

      {title && (
        <div className="flex items-center justify-between px-3.5 pt-3 pb-2.5">
          <span className="text-[11px] tracking-[0.14em] text-white/62 uppercase">{title}</span>
          {tag && (
            <span className="font-mono text-xs" style={{ color: 'var(--color-accent)' }}>
              {tag}
            </span>
          )}
        </div>
      )}
      <div className={`px-3.5 pb-3.5 ${fill ? 'min-h-0 flex-1 overflow-y-auto' : ''}`}>
        {children}
      </div>
    </section>
  )
}

function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute size-2.5 rounded-[3px] ${className}`}
      style={{ borderColor: 'color-mix(in srgb, var(--color-accent) 45%, transparent)' }}
    />
  )
}
