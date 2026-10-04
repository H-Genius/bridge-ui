/**
 * 人际
 * ═══════════════════════════════════════════════════════════
 * ★ 你要填的地方：联系人详情、互动记录、重要日期提醒。
 */

import { useBridge } from '@/state/store'
import { Panel } from '@/components/Panel'
import { daysSince, whoToReachOut } from '@/core/derive'


export function PeoplePageLeft() {
  const people = useBridge((s) => s.data.people)
  const needReach = whoToReachOut(people)

  return (
      <aside className="flex min-h-0 flex-col gap-3.5">
        <Panel title="该联系了" tag={String(needReach.length)}>
          {needReach.map((p) => {
            const d = daysSince(p.lastContact)
            return (
              <div key={p.id} className="mb-2.5 last:mb-0">
                <div className="text-[13px]">{p.name}</div>
                <div className="text-[10px] text-white/55">
                  {d === null ? '从未联系过' : `${d} 天没联系`}
                </div>
              </div>
            )
          })}
          {needReach.length === 0 && (
            <p className="text-xs text-white/55">都联系过了，挺好。</p>
          )}
        </Panel>
      </aside>
  )
}

export function PeoplePageCenter() {
  const people = useBridge((s) => s.data.people)
  const needReach = whoToReachOut(people)

  return (
      <section className="relative flex min-h-0 flex-col items-center justify-center gap-3 text-center">
        <div
          className="pointer-events-none absolute inset-0 -z-1"
          style={{
            background:
              'radial-gradient(48% 42% at 50% 50%, color-mix(in srgb, var(--color-accent) 9%, transparent) 0%, transparent 70%)',
          }}
        />
        <div className="text-[10px] tracking-[0.22em] text-white/55 uppercase">人际</div>
        <h1
          className="text-[clamp(24px,3.2vw,44px)] font-medium"
          style={{ textShadow: '0 2px 30px rgba(0,0,0,.65)' }}
        >{people.length}</h1>
        <p className="max-w-[30ch] text-[13px] text-white/62">
          记录了 {people.length} 个人，其中 {needReach.length} 个该联系了。
        </p>
      </section>
  )
}

export function PeoplePageRight() {
  const people = useBridge((s) => s.data.people)

  return (
      <aside className="flex min-h-0 flex-col gap-3.5">
        <Panel title="全部联系人" fill>
          {people.map((p) => {
            const d = daysSince(p.lastContact)
            return (
              <div key={p.id} className="mb-2 flex justify-between text-[12px] last:mb-0">
                <span className="text-white/62">{p.name}</span>
                <span className="font-mono text-[10px] text-white/55">
                  {d === null ? '—' : `${d}d`}
                </span>
              </div>
            )
          })}
        </Panel>
      </aside>
  )
}

export const PeoplePage = { left: PeoplePageLeft, center: PeoplePageCenter, right: PeoplePageRight }