/**
 * 技能
 * ═══════════════════════════════════════════════════════════
 * ★ 你要填的地方：技能雷达图（用 recharts 或手写 SVG）、
 *   练习记录、和「离目标还差多少」的推算。
 */

import { useBridge } from '@/state/store'
import { Panel } from '@/components/Panel'
import { ProgressBar } from '@/components/ProgressBar'


export function SkillsPageLeft() {
  const skills = useBridge((s) => s.data.skills)


  return (
      <aside className="flex min-h-0 flex-col gap-3.5">
        <Panel title="技能等级" fill>
          {skills.map((s) => (
            <div key={s.id} className="mb-3 last:mb-0">
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="text-white/62">{s.name}</span>
                <b className="font-mono font-normal text-white/94">
                  {s.level}
                  {s.target ? <span className="text-white/55">/{s.target}</span> : null}
                </b>
              </div>
              <ProgressBar value={s.level / 100} thin />
            </div>
          ))}
          {skills.length === 0 && <p className="text-xs text-white/55">还没有记录技能。</p>}
        </Panel>
      </aside>
  )
}

export function SkillsPageCenter() {
  const skills = useBridge((s) => s.data.skills)

  const avg = skills.length ? skills.reduce((a, s) => a + s.level, 0) / skills.length : 0
  const gap = skills.filter((s) => s.target && s.level < s.target)

  return (
      <section className="relative flex min-h-0 flex-col items-center justify-center gap-3 text-center">
        <div
          className="pointer-events-none absolute inset-0 -z-1"
          style={{
            background:
              'radial-gradient(48% 42% at 50% 50%, color-mix(in srgb, var(--color-accent) 9%, transparent) 0%, transparent 70%)',
          }}
        />
        <div className="text-[10px] tracking-[0.22em] text-white/55 uppercase">平均等级</div>
        <h1
          className="text-[clamp(24px,3.2vw,44px)] font-medium"
          style={{ textShadow: '0 2px 30px rgba(0,0,0,.65)' }}
        >
          {Math.round(avg)}
          <span className="ml-1 text-[0.4em] text-white/55">/ 100</span>
        </h1>
        <p className="max-w-[30ch] text-[13px] text-white/62">
          {skills.length} 项技能，其中 {gap.length} 项离目标还有距离。
        </p>
      </section>
  )
}

export function SkillsPageRight() {
  const skills = useBridge((s) => s.data.skills)

  const gap = skills.filter((s) => s.target && s.level < s.target)

  return (
      <aside className="flex min-h-0 flex-col gap-3.5">
        <Panel title="离目标还差" tag={String(gap.length)}>
          {gap.map((s) => (
            <div key={s.id} className="mb-2 flex justify-between text-[12px] last:mb-0">
              <span className="text-white/62">{s.name}</span>
              <span className="font-mono text-[10px] text-white/55">
                +{(s.target ?? 0) - s.level}
              </span>
            </div>
          ))}
          {gap.length === 0 && <p className="text-xs text-white/55">都达标了。</p>}
        </Panel>
      </aside>
  )
}

export const SkillsPage = { left: SkillsPageLeft, center: SkillsPageCenter, right: SkillsPageRight }