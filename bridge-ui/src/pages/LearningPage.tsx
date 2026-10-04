/**
 * 学习
 * ═══════════════════════════════════════════════════════════
 * ★ 你要填的地方：学习时长统计、主题分布、连续天数。
 *   如果想画图表，装 recharts，用动态 import 按需加载。
 */

import { useBridge } from '@/state/store'
import { Panel } from '@/components/Panel'
import { ProgressBar } from '@/components/ProgressBar'


export function LearningPageLeft() {
  const sessions = useBridge((s) => s.data.sessions)

  const byTopic = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.topic] = (acc[s.topic] ?? 0) + s.minutes
    return acc
  }, {})
  const maxMin = Math.max(1, ...Object.values(byTopic))

  return (
      <aside className="flex min-h-0 flex-col gap-3.5">
        <Panel title="主题分布">
          {Object.entries(byTopic).map(([topic, min]) => (
            <div key={topic} className="mb-2.5 last:mb-0">
              <div className="mb-1 flex justify-between text-[11px] text-white/62">
                <span>{topic}</span>
                <b className="font-mono font-normal text-white/94">{min} 分</b>
              </div>
              <ProgressBar value={min / maxMin} thin />
            </div>
          ))}
          {sessions.length === 0 && <p className="text-xs text-white/55">还没有学习记录。</p>}
        </Panel>
      </aside>
  )
}

export function LearningPageCenter() {
  const sessions = useBridge((s) => s.data.sessions)

  const totalMin = sessions.reduce((a, s) => a + s.minutes, 0)
  const byTopic = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.topic] = (acc[s.topic] ?? 0) + s.minutes
    return acc
  }, {})

  return (
      <section className="relative flex min-h-0 flex-col items-center justify-center gap-3 text-center">
        <div
          className="pointer-events-none absolute inset-0 -z-1"
          style={{
            background:
              'radial-gradient(48% 42% at 50% 50%, color-mix(in srgb, var(--color-accent) 9%, transparent) 0%, transparent 70%)',
          }}
        />
        <div className="text-[10px] tracking-[0.22em] text-white/55 uppercase">累计学习</div>
        <h1
          className="text-[clamp(24px,3.2vw,44px)] font-medium"
          style={{ textShadow: '0 2px 30px rgba(0,0,0,.65)' }}
        >
          {Math.round(totalMin / 60)}
          <span className="ml-1 text-[0.4em] text-white/55">小时</span>
        </h1>
        <p className="max-w-[30ch] text-[13px] text-white/62">
          共 {sessions.length} 次记录，涉及 {Object.keys(byTopic).length} 个主题。
        </p>
      </section>
  )
}

export function LearningPageRight() {
  const sessions = useBridge((s) => s.data.sessions)
  const skills = useBridge((s) => s.data.skills)

  return (
      <aside className="flex min-h-0 flex-col gap-3.5">
        <Panel title="最近记录" fill>
          {sessions.slice(0, 6).map((s) => (
            <div key={s.id} className="mb-2.5 flex justify-between text-[12px] last:mb-0">
              <span className="text-white/62">{s.topic}</span>
              <span className="font-mono text-[10px] text-white/55">{s.minutes} 分</span>
            </div>
          ))}
        </Panel>
        <Panel title="技能等级" tag={String(skills.length)}>
          {skills.slice(0, 4).map((s) => (
            <div key={s.id} className="mb-1.5 text-[12px] text-white/62 last:mb-0">
              {s.name} · {s.level}
            </div>
          ))}
        </Panel>
      </aside>
  )
}

export const LearningPage = { left: LearningPageLeft, center: LearningPageCenter, right: LearningPageRight }