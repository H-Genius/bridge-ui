/**
 * 全局状态 —— zustand
 * ═══════════════════════════════════════════════════════════
 *
 * 这里只放**跨组件共享**的状态：
 *   · 当前的环境状态（ambience）
 *   · 当前在哪个模块
 *   · 数据快照（从 repo 读出来的一份）
 *
 * ⚠️ 不要把所有东西都塞进来。局部状态（比如表单的草稿）
 *    应该留在组件里用 useState。
 */

import { create } from 'zustand'
import type { Ambience } from '@/core/ambience'
import { deriveAmbience, AMBIENCE_LOG } from '@/core/ambience'
import { todayKey, actionsOn as pickActionsOn, overdueCount } from '@/core/derive'
import { repo } from '@/data/repo'
import type { AppData, Action, Goal } from '@/data/types'
import { emptyData } from '@/data/types'

/** 九个导航模块 */
export const NAV_ITEMS = [
  '驾驶舱',
  '今日',
  '项目',
  '学习',
  'AI',
  '人际',
  '规划',
  '技能',
  '系统',
] as const
export type NavKey = (typeof NAV_ITEMS)[number]

interface LogEntry {
  time: string
  text: string
}

interface BridgeState {
  /* ── 环境状态 ── */
  ambience: Ambience
  /** 重新计算环境状态（数据变化后调用） */
  /** ★ 手动锁定：用户手动选过状态后，自动重算不再覆盖它 */
  ambienceLocked: boolean
  recomputeAmbience: () => void
  /** 手动指定状态（调试 / 预览用） */
  setAmbience: (a: Ambience) => void

  /* ── 界面 ── */
  nav: NavKey
  setNav: (n: NavKey) => void
  petOpen: boolean
  togglePet: () => void

  /* ── 数据快照 ── */
  data: AppData
  /** 从 repo 重新读一遍（任何写操作后都该调用） */
  refresh: () => void

  /* ── 派生值（每次 refresh 后算好，组件直接用） ── */
  actionsToday: Action[]
  overdue: number
  focusGoal: Goal | null

  /* ── 航行日志 ── */
  logs: LogEntry[]
  pushLog: (text: string) => void
}

/** 把若干派生值一次算好 */
function derive(data: AppData, ambience: Ambience) {
  const today = todayKey()
  const actionsToday = pickActionsOn(data.actions, today)
  const overdue = overdueCount(data.actions, today)

  const focusGoal =
    data.goals
      .filter((g) => !g.done)
      .sort((a, b) => b.progress - a.progress)[0] ?? null

  const next = deriveAmbience({
    now: new Date(),
    actionsToday,
    overdueCount: overdue,
    previous: ambience,
  })

  return { actionsToday, overdue, focusGoal, next }
}

export const useBridge = create<BridgeState>((set, get) => {
  // 首次启动：没有数据就写入种子数据
  const initial = repo.all()
  const isEmpty =
    initial.goals.length === 0 &&
    initial.actions.length === 0 &&
    initial.projects.length === 0

  let data = initial
  if (isEmpty) {
    // 动态 import 会让这里变异步，所以直接同步取种子
    // （种子数据很小，同步构造没有性能问题）
    void import('@/data/seed').then(({ seedData }) => {
      const seeded = seedData()
      repo.importJson(JSON.stringify(seeded))
      get().refresh()
    })
    data = emptyData()
  }

  const d = derive(data, 'calm')

  return {
    ambience: d.next,
    ambienceLocked: false,

    recomputeAmbience: () => {
      const s = get()
      const r = derive(s.data, s.ambience)
      // ★ 用户手动选过状态就不覆盖 —— 否则切到「抵达新区域」后，
      //   30 秒的自动重算会把它改回「高速航行」，看起来像没生效。
      if (!s.ambienceLocked && r.next !== s.ambience) {
        set({ ambience: r.next })
        s.pushLog(AMBIENCE_LOG[r.next])
      }
      set({ actionsToday: r.actionsToday, overdue: r.overdue, focusGoal: r.focusGoal })
    },

    setAmbience: (a) => {
      set({ ambience: a, ambienceLocked: true })
      get().pushLog(AMBIENCE_LOG[a])
    },

    nav: '驾驶舱',
    setNav: (n) => set({ nav: n }),

    petOpen: true,
    togglePet: () => set((s) => ({ petOpen: !s.petOpen })),

    data,
    refresh: () => {
      const fresh = repo.all()
      const s = get()
      const r = derive(fresh, s.ambience)
      set({
        data: fresh,
        actionsToday: r.actionsToday,
        overdue: r.overdue,
        focusGoal: r.focusGoal,
        // ★ 同样尊重手动锁定：勾选任务时不该把用户选的环境状态冲掉
        ...(s.ambienceLocked ? {} : { ambience: r.next }),
      })
    },

    actionsToday: d.actionsToday,
    overdue: d.overdue,
    focusGoal: d.focusGoal,

    logs: [],
    pushLog: (text) =>
      set((s) => {
        const now = new Date()
        const p = (n: number) => String(n).padStart(2, '0')
        const entry = { time: `${p(now.getHours())}:${p(now.getMinutes())}`, text }
        return { logs: [entry, ...s.logs].slice(0, 12) }
      }),
  }
})