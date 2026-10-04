/**
 * 项目
 * ═══════════════════════════════════════════════════════════
 * ★ 你要填的地方：项目详情、进度推算、和目标的关联视图。
 */

import { useBridge } from '@/state/store'
import { Panel } from '@/components/Panel'

const STATUS_LABEL: Record<string, string> = {
  planning: '规划中',
  active: '进行中',
  paused: '已暂停',
  done: '已完成',
}


export function ProjectsPageLeft() {
  const projects = useBridge((s) => s.data.projects)

  const active = projects.filter((p) => p.status === 'active')

  return (
      <aside className="flex min-h-0 flex-col gap-3.5">
        <Panel title="进行中" tag={String(active.length)}>
          {active.map((p) => (
            <div key={p.id} className="mb-3 last:mb-0">
              <div className="mb-1 text-[13px]">{p.name}</div>
              <div className="text-[10px] text-white/55">
                关联 {p.goalIds.length} 个目标
              </div>
            </div>
          ))}
          {active.length === 0 && <p className="text-xs text-white/55">没有进行中的项目。</p>}
        </Panel>
      </aside>
  )
}

export function ProjectsPageCenter() {
  const projects = useBridge((s) => s.data.projects)

  const active = projects.filter((p) => p.status === 'active')

  return (
      <section className="relative flex min-h-0 flex-col items-center justify-center gap-3 text-center">
        <div
          className="pointer-events-none absolute inset-0 -z-1"
          style={{
            background:
              'radial-gradient(48% 42% at 50% 50%, color-mix(in srgb, var(--color-accent) 9%, transparent) 0%, transparent 70%)',
          }}
        />
        <div className="text-[10px] tracking-[0.22em] text-white/55 uppercase">项目</div>
        <h1
          className="text-[clamp(24px,3.2vw,44px)] font-medium"
          style={{ textShadow: '0 2px 30px rgba(0,0,0,.65)' }}
        >
          {projects.length}
        </h1>
        <p className="max-w-[30ch] text-[13px] text-white/62">
          共 {projects.length} 个项目，其中 {active.length} 个正在进行。
        </p>
      </section>
  )
}

export function ProjectsPageRight() {
  const projects = useBridge((s) => s.data.projects)
  const goals = useBridge((s) => s.data.goals)

  const others = projects.filter((p) => p.status !== 'active')

  return (
      <aside className="flex min-h-0 flex-col gap-3.5">
        <Panel title="其他项目" fill>
          {others.map((p) => (
            <div key={p.id} className="mb-2.5 flex justify-between text-[12px] last:mb-0">
              <span className="text-white/62">{p.name}</span>
              <span className="text-[10px] text-white/55">{STATUS_LABEL[p.status]}</span>
            </div>
          ))}
          {others.length === 0 && <p className="text-xs text-white/55">没有其他项目。</p>}
        </Panel>
        <Panel title="可关联目标" tag={String(goals.length)}>
          {goals.slice(0, 4).map((g) => (
            <div key={g.id} className="mb-1.5 text-[12px] text-white/62 last:mb-0">
              {g.title}
            </div>
          ))}
        </Panel>
      </aside>
  )
}

export const ProjectsPage = { left: ProjectsPageLeft, center: ProjectsPageCenter, right: ProjectsPageRight }