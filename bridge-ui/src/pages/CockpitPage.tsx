/**
 * 驾驶舱 —— 总览
 * ═══════════════════════════════════════════════════════════
 * 它不做新东西，只是把其他模块的信息聚合展示。
 * 所以它是「最后做」的那个 —— 依赖前面所有模块的数据。
 */

import { useBridge } from '@/state/store'
import { completionRatio } from '@/core/derive'
import { GoalRing } from '@/components/GoalRing'
import { ProgressBar } from '@/components/ProgressBar'
import { Panel } from '@/components/Panel'


export function CockpitPageLeft() {
  const actionsToday = useBridge((s) => s.actionsToday)
  const data = useBridge((s) => s.data)
  const ratio = completionRatio(actionsToday)

  return (
      <aside className="flex min-h-0 flex-col gap-3.5">
        <Panel title="今日进度" tag={`${Math.round(ratio * 100)}%`}>
          <ProgressBar value={ratio} />
          <div className="mt-2 font-mono text-xs text-white/62">
            {actionsToday.filter((a) => a.done).length} / {actionsToday.length}
          </div>
        </Panel>

        <Panel title="领域分布">
          {['事业', '学习', '生活'].map((area) => {
            const goals = data.goals.filter((g) => g.area === area)
            const avg = goals.length
              ? goals.reduce((a, g) => a + g.progress, 0) / goals.length
              : 0
            return (
              <div key={area} className="mb-2.5 last:mb-0">
                <div className="mb-1 flex justify-between text-[11px] text-white/62">
                  <span>{area}</span>
                  <b className="font-mono font-normal text-white/94">
                    {Math.round(avg * 100)}%
                  </b>
                </div>
                <ProgressBar value={avg} thin />
              </div>
            )
          })}
        </Panel>
      </aside>
  )
}

export function CockpitPageCenter() {
  const actionsToday = useBridge((s) => s.actionsToday)
  const focusGoal = useBridge((s) => s.focusGoal)

  return (
      <section className="relative flex min-h-0 flex-col items-center justify-center gap-3 text-center">
        {/* ★ 中央景观留白：面板只在边缘，中区是悬窗的主视野。
            这里只放一层极淡的中心光晕，让视线自然落到目标上。 */}
        <div
          className="pointer-events-none absolute inset-0 -z-1"
          style={{
            background:
              'radial-gradient(48% 42% at 50% 50%, color-mix(in srgb, var(--color-accent) 9%, transparent) 0%, transparent 70%)',
          }}
        />

        <div className="text-[10px] tracking-[0.22em] text-white/55 uppercase">当前重点</div>
        <h1
          className="text-[clamp(24px,3.2vw,44px)] font-medium"
          style={{ textShadow: '0 2px 30px rgba(0,0,0,.65)' }}
        >
          {focusGoal?.title ?? '还没有目标'}
        </h1>
        <GoalRing value={focusGoal?.progress ?? 0} />

        {/* ★ 悬窗「航行读数」—— 极轻的一行，告诉你在哪、往哪走 */}
        <div className="mt-1 flex items-center gap-4 font-mono text-[10px] tracking-[0.14em] text-white/55 uppercase">
          <span>舰位 · 巡航中</span>
          <span className="h-3 w-px bg-white/15" />
          <span>今日 {actionsToday.length} 项任务</span>
          <span className="h-3 w-px bg-white/15" />
          <span>剩余 {actionsToday.length - actionsToday.filter((a) => a.done).length} 项</span>
        </div>
      </section>
  )
}

export function CockpitPageRight() {
  const overdue = useBridge((s) => s.overdue)
  const data = useBridge((s) => s.data)

  return (
      <aside className="flex min-h-0 flex-col gap-3.5">
        <Panel title="系统状态">
          <Stat label="目标数" value={String(data.goals.length)} />
          <Stat
            label="项目中"
            value={String(data.projects.filter((p) => p.status === 'active').length)}
          />
          <Stat label="逾期" value={String(overdue)} warn={overdue > 0} />
          <Stat label="技能" value={String(data.skills.length)} />
        </Panel>
      </aside>
  )
}

export const CockpitPage = { left: CockpitPageLeft, center: CockpitPageCenter, right: CockpitPageRight }
function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="mb-2 flex justify-between text-[12px] last:mb-0">
      <span className="text-white/62">{label}</span>
      <b className="font-mono font-normal" style={{ color: warn ? 'var(--color-accent)' : undefined }}>
        {value}
      </b>
    </div>
  )
}