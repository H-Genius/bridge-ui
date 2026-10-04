/**
 * 规划
 * ═══════════════════════════════════════════════════════════
 * ★ 你要填的地方：目标树（年 → 季 → 月 → 周）的层级视图、
 *   拖拽调整、以及「这个季度的三个重点」这类聚合。
 */

import { useBridge } from '@/state/store'
import { Panel } from '@/components/Panel'
import { GoalRing } from '@/components/GoalRing'
import { ProgressBar } from '@/components/ProgressBar'
import type { Goal } from '@/data/types'

const HORIZON_LABEL: Record<Goal['horizon'], string> = {
  year: '年度',
  quarter: '季度',
  month: '月度',
  week: '本周',
}


export function PlanningPageLeft() {
  const goals = useBridge((s) => s.data.goals)

  const grouped = (['year', 'quarter', 'month', 'week'] as Goal['horizon'][]).map((h) => ({
    horizon: h,
    items: goals.filter((g) => g.horizon === h),
  }))


  return (
      <aside className="flex min-h-0 flex-col gap-3.5">
        {grouped
          .filter((g) => g.items.length > 0)
          .map(({ horizon, items }) => (
            <Panel key={horizon} title={HORIZON_LABEL[horizon]} tag={String(items.length)}>
              {items.map((g) => (
                <div key={g.id} className="mb-2.5 last:mb-0">
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-white/62">{g.title}</span>
                    <b className="font-mono font-normal text-white/94">
                      {Math.round(g.progress * 100)}%
                    </b>
                  </div>
                  <ProgressBar value={g.progress} thin />
                </div>
              ))}
            </Panel>
          ))}
      </aside>
  )
}

export function PlanningPageCenter() {
  const goals = useBridge((s) => s.data.goals)

  const avg = goals.length ? goals.reduce((a, g) => a + g.progress, 0) / goals.length : 0

  return (
      <section className="flex min-h-0 flex-col items-center justify-center gap-3 text-center">
        <div className="text-[10px] tracking-[0.22em] text-white/55 uppercase">整体进度</div>
        <GoalRing value={avg} />
        <p className="max-w-[30ch] text-[13px] text-white/62">
          共 {goals.length} 个目标，平均推进到 {Math.round(avg * 100)}%。
        </p>
      </section>
  )
}

export const PlanningPage = { left: PlanningPageLeft, center: PlanningPageCenter, right: null }