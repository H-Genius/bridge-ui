/**
 * 底部一体化舰桥控制台
 * ═══════════════════════════════════════════════════════════
 * 左边：仪表显示区（哑光黑 / 钛灰 / 陶瓷白三档明暗，自然过渡）
 * 右边：九个导航模块
 *
 * ★ 设计约束（来自设想）：
 *   · 大块明暗对比 —— 陶瓷白块与哑光黑底座并置
 *   · 少量青蓝 —— 只在「标记当前状态」处出现
 */

import { useEffect, useState } from 'react'
import { NAV_ITEMS, useBridge } from '@/state/store'
import { hhmm } from '@/core/derive'

/** 九个模块配图标与说明 —— 让导航不只是文字按钮 */
const NAV_META: Record<string, { icon: string; hint: string }> = {
  驾驶舱: { icon: 'M3 12L12 3l9 9-9 9z', hint: '总览' },
  今日: { icon: 'M4 6h16v14H4z M8 3v4 M16 3v4', hint: '行动' },
  项目: { icon: 'M3 7h7l2 2h9v10H3z', hint: '推进' },
  学习: { icon: 'M4 5h7v14H4z M13 5h7v14h-7z', hint: '输入' },
  AI: { icon: 'M12 3l2.5 6L21 11l-6.5 2L12 19l-2.5-6L3 11l6.5-2z', hint: '副官' },
  人际: { icon: 'M9 11a3 3 0 100-6 3 3 0 000 6z M3 20a6 6 0 0112 0 M17 8a2.5 2.5 0 100-5', hint: '连接' },
  规划: { icon: 'M4 4h16v16H4z M4 9h16 M9 4v16', hint: '布局' },
  技能: { icon: 'M12 3l8 4.5v9L12 21l-8-4.5v-9z', hint: '成长' },
  系统: { icon: 'M12 9a3 3 0 100 6 3 3 0 000-6z M19 12a7 7 0 01-.1 1l2 1.5-2 3.5-2.3-1a7 7 0 01-1.7 1l-.3 2.5h-4l-.3-2.5a7 7 0 01-1.7-1l-2.3 1-2-3.5L5 13a7 7 0 010-2l-2-1.5 2-3.5 2.3 1a7 7 0 011.7-1L9.3 3h4l.3 2.5a7 7 0 011.7 1l2.3-1 2 3.5L17.6 11c.1.3.1.7.1 1z', hint: '设置' },
}

export function Console() {
  const nav = useBridge((s) => s.nav)
  const setNav = useBridge((s) => s.setNav)
  const overdue = useBridge((s) => s.overdue)
  const actionsToday = useBridge((s) => s.actionsToday)
  const ambience = useBridge((s) => s.ambience)

  // 负载 = 逾期越多越「重」，这里给个直观的映射
  const load = Math.min(100, overdue * 12)
  const doneCount = actionsToday.filter((a) => a.done).length
  const remainCount = actionsToday.length - doneCount

  // 控制台里的实时时钟（秒级，让仪表「在跳」）
  const [now, setNow] = useState(hhmm())
  useEffect(() => {
    const t = setInterval(() => setNow(hhmm()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <footer className="console-base shrink-0 px-5 py-3">
      <div className="grid grid-cols-[1fr_auto] items-center gap-6">
        {/* ── 仪表显示区 ── */}
        <div className="flex items-center gap-3">
          {/* 陶瓷白主仪表：今日推进（唯一的大块浅色，与黑底形成强对比） */}
          <div className="gauge-ceramic ceramic-sheen flex h-15 min-w-[210px] flex-col justify-center gap-1.5 rounded-lg px-3.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] tracking-[0.16em] uppercase opacity-60">今日推进</span>
              <b className="font-mono text-[17px] leading-none font-semibold">
                {doneCount}
                <span className="opacity-45">/{actionsToday.length}</span>
              </b>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/12">
                <i
                  className="block h-full rounded-full transition-[width] duration-1000"
                  style={{
                    width: `${actionsToday.length ? (doneCount / actionsToday.length) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #1a1d22, #3d434b)',
                  }}
                />
              </div>
              <span className="font-mono text-[9px] opacity-55">
                {actionsToday.length ? Math.round((doneCount / actionsToday.length) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* 钛灰仪表组：负载 / 逾期 / 待办 / 信号 / 舰钟 */}
          <div className="gauge-titanium flex h-15 items-center gap-4 rounded-lg px-4">
            <Instrument label="任务负载">
              <div className="h-[3px] w-20 overflow-hidden rounded-sm bg-white/12">
                <i
                  className="block h-full rounded-sm transition-[width] duration-1000"
                  style={{
                    width: `${load}%`,
                    background: 'var(--color-accent)',
                    boxShadow: '0 0 8px var(--accent-dim)',
                  }}
                />
              </div>
            </Instrument>

            <Instrument label="逾期">
              <span className="font-mono text-sm">
                {overdue}
                <span className="ml-0.5 text-[10px] text-white/58">项</span>
              </span>
            </Instrument>

            <Instrument label="待办">
              <span className="font-mono text-sm">
                {remainCount}
                <span className="ml-0.5 text-[10px] text-white/58">项</span>
              </span>
            </Instrument>

            <Instrument label="信号">
              <div className="flex h-3.5 items-end gap-0.5">
                {[35, 55, 75, 100].map((h, i) => (
                  <i
                    key={h}
                    className="w-[3px] rounded-sm"
                    style={{
                      height: `${h}%`,
                      background: 'var(--color-accent)',
                      opacity: 0.85,
                      animation: `breathe ${2.4 + i * 0.4}s ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>
            </Instrument>

            <Instrument label="舰钟">
              <span className="font-mono text-sm tracking-wide">{now}</span>
            </Instrument>

            <Instrument label="状态">
              <span className="flex items-center gap-1.5 text-[11px]">
                <i
                  className="size-1.5 rounded-full"
                  style={{
                    background: 'var(--color-accent)',
                    boxShadow: '0 0 8px var(--color-accent)',
                    animation: 'breathe 2.6s ease-in-out infinite',
                  }}
                />
                {ambience === 'warning' ? '警戒' : '正常'}
              </span>
            </Instrument>
          </div>
        </div>

        {/* ── 九个导航 ── */}
        <nav className="flex flex-wrap justify-end gap-1">
          {NAV_ITEMS.map((name) => {
            const on = name === nav
            const meta = NAV_META[name]
            return (
              <button
                key={name}
                type="button"
                onClick={() => setNav(name)}
                title={meta?.hint}
                className="group flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 transition-all duration-300 hover:bg-white/6"
                style={{
                  background: on ? 'var(--accent-dim)' : 'transparent',
                  borderColor: on ? 'var(--color-accent)' : 'transparent',
                  color: on ? '#fff' : 'rgba(255,255,255,.62)',
                  // ★ 顶部一条细的强调色条 —— 「少量青蓝标记」的正确用法
                  boxShadow: on
                    ? 'inset 0 2px 0 var(--color-accent), 0 0 18px var(--accent-dim)'
                    : 'none',
                }}
              >
                {/* 模块图标 */}
                {meta && (
                  <svg
                    viewBox="0 0 24 24"
                    className="size-[15px] shrink-0 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: on ? 1 : 0.55 }}
                  >
                    <path d={meta.icon} />
                  </svg>
                )}
                <span className="flex flex-col items-start leading-none">
                  <span className="text-xs">{name}</span>
                  <span
                    className="mt-0.5 text-[8.5px] tracking-[0.1em] uppercase"
                    style={{ opacity: on ? 0.7 : 0.38 }}
                  >
                    {meta?.hint}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </footer>
  )
}

function Instrument({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1" style={{ minWidth: 62 }}>
      <span className="text-[9px] tracking-[0.14em] text-white/58 uppercase">{label}</span>
      {children}
    </div>
  )
}
