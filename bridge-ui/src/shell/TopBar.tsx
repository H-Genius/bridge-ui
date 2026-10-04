/**
 * 顶部状态条 —— 舰桥的「主仪表带」
 * ═══════════════════════════════════════════════════════════
 * 从左到右，信息密度依次递减：
 *   ① 舰徽 + 系统标识 + 状态灯
 *   ② 主读数组（时间 / 今日完成 / 连续天数）—— 带刻度与趋势
 *   ③ 环境状态切换器
 *   ④ 系统健康指示（信号条 / 负载）
 *
 * ★ 设计语言与底栏一致：哑光黑底 + 钛灰分区块 + 一处陶瓷白亮点。
 */

import { useEffect, useState } from 'react'
import { useBridge } from '@/state/store'
import { AMBIENCE_LABEL } from '@/core/ambience'
import { SCENES, AMBIENCE_ORDER } from '@/core/scene'
import { hhmm } from '@/core/derive'

export function TopBar() {
  const ambience = useBridge((s) => s.ambience)
  const setAmbience = useBridge((s) => s.setAmbience)
  const actionsToday = useBridge((s) => s.actionsToday)
  const overdue = useBridge((s) => s.overdue)
  const logs = useBridge((s) => s.logs)

  const [clock, setClock] = useState(hhmm())
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    const t = setInterval(() => {
      setClock(hhmm())
      setSecs((s) => s + 1)
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const done = actionsToday.filter((a) => a.done).length
  const total = actionsToday.length
  const ratio = total ? done / total : 0

  // 系统健康度：逾期越多越低（这里给个直观映射）
  const health = Math.max(0, 100 - overdue * 14)

  return (
    <header className="console-base grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-2.5">
      {/* ① 舰徽 */}
      <div className="flex items-center gap-3">
        <div className="relative">
          {/* 旋转的刻度环 —— 让舰徽「在运转」 */}
          <svg viewBox="0 0 40 40" className="absolute -inset-1.5 size-10 animate-[spin-slow_18s_linear_infinite]">
            <circle
              cx="20"
              cy="20"
              r="17"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="0.8"
              strokeDasharray="2 7"
              opacity="0.5"
            />
          </svg>
          <div
            className="grid size-7 place-items-center rounded-lg"
            style={{
              background:
                'linear-gradient(140deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 12%, transparent))',
              boxShadow: '0 0 16px var(--accent-dim)',
            }}
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="#04121c">
              <path d="M8 1l2 5h5l-4 3 1.6 5L8 11l-4.6 3L5 9 1 6h5z" />
            </svg>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[13px] tracking-[0.2em]">BRIDGE</span>
            {/* 在线指示灯 */}
            <span
              className="size-1.5 rounded-full"
              style={{
                background: overdue > 0 ? 'var(--color-accent)' : '#6ee7a8',
                boxShadow: `0 0 8px ${overdue > 0 ? 'var(--color-accent)' : '#6ee7a8'}`,
                animation: 'breathe 2.6s ease-in-out infinite',
              }}
            />
          </div>
          <div className="mt-0.5 truncate text-[10.5px] text-white/58">
            {AMBIENCE_LABEL[ambience]}
          </div>
        </div>
      </div>

      {/* ② 主读数区 —— 钛灰仪表块，分格显示 */}
      <div className="gauge-titanium flex items-center justify-center gap-0 rounded-lg px-1 py-1">
        <Readout label="舰钟" value={clock} sub={`${secs}s`} />

        <Divider />

        <Readout label="今日完成" value={`${done}/${total}`} sub={`${Math.round(ratio * 100)}%`} />

        <Divider />

        {/* ★ 唯一的陶瓷白亮点：进度条 + 大号百分比 */}
        <div className="gauge-ceramic ceramic-sheen flex h-9 items-center gap-2.5 rounded-md px-3">
          <div className="flex flex-col gap-[3px]">
            <span className="text-[8.5px] leading-none tracking-[0.14em] uppercase opacity-55">
              执行率
            </span>
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-black/15">
              <i
                className="block h-full rounded-full transition-[width] duration-1000"
                style={{
                  width: `${ratio * 100}%`,
                  background: 'linear-gradient(90deg, #1a1d22, #454b54)',
                }}
              />
            </div>
          </div>
          <b className="font-mono text-[15px] leading-none font-semibold">
            {Math.round(ratio * 100)}
            <span className="text-[9px] opacity-50">%</span>
          </b>
        </div>

        <Divider />

        {/* 系统健康 —— 迷你条形图 */}
        <div className="flex flex-col gap-[3px] px-2">
          <span className="text-[8.5px] leading-none tracking-[0.14em] text-white/58 uppercase">
            系统健康
          </span>
          <div className="flex h-3.5 items-end gap-[3px]">
            {Array.from({ length: 9 }).map((_, i) => {
              const on = health > i * 11
              return (
                <i
                  key={i}
                  className="w-[3px] rounded-sm transition-colors duration-500"
                  style={{
                    height: `${40 + i * 6}%`,
                    background: on ? 'var(--color-accent)' : 'rgba(255,255,255,.14)',
                    boxShadow: on ? '0 0 6px var(--accent-dim)' : 'none',
                  }}
                />
              )
            })}
          </div>
        </div>

        <Divider />

        {/* 日志计数 */}
        <Readout label="航行日志" value={String(logs.length)} sub="条" />
      </div>

      {/* ③ 环境状态切换器 */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] tracking-[0.14em] text-white/58 uppercase">环境状态</span>
          <div className="flex gap-1">
            {AMBIENCE_ORDER.map((key) => {
              const on = key === ambience
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAmbience(key)}
                  className="cursor-pointer rounded-full border px-2.5 py-1 text-[11px] whitespace-nowrap transition-all duration-300 hover:border-white/25"
                  style={{
                    borderColor: on ? 'var(--color-accent)' : 'rgba(255,255,255,.13)',
                    background: on ? 'var(--accent-dim)' : 'transparent',
                    color: on ? '#fff' : 'rgba(255,255,255,.62)',
                    boxShadow: on ? '0 0 14px var(--accent-dim)' : 'none',
                  }}
                >
                  {SCENES[key].label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}

function Readout({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-[3px] px-2.5">
      <span className="text-[8.5px] leading-none tracking-[0.14em] text-white/58 uppercase">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-[15px] leading-none tracking-[0.03em]">{value}</span>
        {sub && <span className="font-mono text-[9px] leading-none text-white/45">{sub}</span>}
      </div>
    </div>
  )
}

function Divider() {
  return <span className="h-7 w-px shrink-0 bg-white/10" />
}
