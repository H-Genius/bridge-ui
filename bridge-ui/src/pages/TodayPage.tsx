/**
 * 今日 —— 行动清单
 * ═══════════════════════════════════════════════════════════
 *
 * ★ 这是「真功能」的第一个页面：
 *   勾选 → 写回 repo → 刷新 store → 环境状态跟着变
 *
 * 这条闭环就是整个应用的核心。
 */

import { useBridge } from '@/state/store'
import { repo } from '@/data/repo'
import { completionRatio } from '@/core/derive'
import { Panel } from '@/components/Panel'


export function TodayPageLeft() {
  const actionsToday = useBridge((s) => s.actionsToday)
  const refresh = useBridge((s) => s.refresh)

  const ratio = completionRatio(actionsToday)

  function toggle(id: string) {
    repo.toggleAction(id)
    refresh() // ★ 这一步会连带重算环境状态
  }

  return (
      <aside className="flex min-h-0 flex-col gap-3.5">
        <Panel title="今日行动" tag={`${Math.round(ratio * 100)}%`} fill className="flex-1">
          <div className="mb-3 h-[3px] overflow-hidden rounded-sm bg-white/8">
            <i
              className="block h-full rounded-sm transition-[width] duration-700"
              style={{ width: `${ratio * 100}%`, background: 'var(--color-accent)' }}
            />
          </div>

          <ul className="-mx-1">
            {actionsToday.map((a) => (
              <li
                key={a.id}
                onClick={() => toggle(a.id)}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/8"
              >
                <span
                  className="mt-px grid size-3.75 shrink-0 place-items-center rounded border-[1.5px] transition-all"
                  style={{
                    borderColor: a.done ? 'var(--color-accent)' : 'rgba(255,255,255,.36)',
                    background: a.done ? 'var(--color-accent)' : 'transparent',
                  }}
                >
                  {a.done && (
                    <svg viewBox="0 0 10 8" className="size-2.5">
                      <path
                        d="M1 4l2.5 2.5L9 1"
                        fill="none"
                        stroke="#04121c"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className="block text-[13px] leading-snug"
                    style={{
                      color: a.done ? 'rgba(255,255,255,.36)' : undefined,
                      textDecoration: a.done ? 'line-through' : undefined,
                    }}
                  >
                    {a.title}
                  </span>
                  {a.startTime && (
                    <span className="mt-0.5 block font-mono text-[10px] text-white/55">
                      {a.startTime}
                    </span>
                  )}
                </span>
              </li>
            ))}
            {actionsToday.length === 0 && (
              <li className="px-2 py-4 text-xs text-white/55">今天还没有安排。</li>
            )}
          </ul>
        </Panel>
      </aside>
  )
}

export function TodayPageCenter() {
  const actionsToday = useBridge((s) => s.actionsToday)

  const ratio = completionRatio(actionsToday)
  const done = actionsToday.filter((a) => a.done).length

  return (
      <section className="relative flex min-h-0 flex-col items-center justify-center gap-3 text-center">
        <div
          className="pointer-events-none absolute inset-0 -z-1"
          style={{
            background:
              'radial-gradient(48% 42% at 50% 50%, color-mix(in srgb, var(--color-accent) 9%, transparent) 0%, transparent 70%)',
          }}
        />
        <div className="text-[10px] tracking-[0.22em] text-white/55 uppercase">今日进度</div>
        <h1
          className="text-[clamp(24px,3.2vw,44px)] font-medium"
          style={{ textShadow: '0 2px 30px rgba(0,0,0,.65)' }}
        >
          {done} / {actionsToday.length}
        </h1>
        <p className="max-w-[30ch] text-[13px] text-white/62">
          {ratio === 1
            ? '今天全部完成了。舰桥即将抵达新区域。'
            : ratio >= 0.5
              ? '过半了，保持这个节奏。'
              : '刚开始，先把最简单的一件做掉。'}
        </p>
      </section>
  )
}

export const TodayPage = { left: TodayPageLeft, center: TodayPageCenter, right: null }