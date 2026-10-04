/**
 * 模块注册表
 * ═══════════════════════════════════════════════════════════
 *
 * ★ 这是「加一个新模块」唯一需要改的地方。
 * 三步：
 *   ① 在 state/store.ts 的 NAV_ITEMS 里加名字
 *   ② 在 pages/ 下建一个组件
 *   ③ 在下面这张表里注册
 *
 * 布局约定（三栏）：每个模块导出左 / 中 / 右三个组件，各占一栏。
 * 不需要的栏位导出 `null`，网格会自动留空。
 *
 * ⚠️ 为什么拆成三个组件而不是「一个函数返回三个 JSX」：
 *   早先的写法是把页面当普通函数调用（`Page()`），这时页面内部的
 *   hooks 会挂到调用者（ActivePage）的 hook 链上。不同模块 hook
 *   数量不同（驾驶舱 4 个、今日 2 个），切换模块时 React 会抛
 *   "Rendered fewer hooks than expected" 并让整个应用白屏。
 *   拆成真正的组件后，每个模块的 hooks 归自己管，切换时干净卸载。
 */

import type { ComponentType } from 'react'
import type { NavKey } from '@/state/store'
import { CockpitPage } from './CockpitPage'
import { TodayPage } from './TodayPage'
import { ProjectsPage } from './ProjectsPage'
import { LearningPage } from './LearningPage'
import { AiPage } from './AiPage'
import { PeoplePage } from './PeoplePage'
import { PlanningPage } from './PlanningPage'
import { SkillsPage } from './SkillsPage'
import { SystemPage } from './SystemPage'
import { useBridge } from '@/state/store'

/** 一个模块拆成三栏，各自是独立组件 */
export interface PageLayout {
  left: ComponentType | null
  center: ComponentType | null
  right: ComponentType | null
}

const PAGES: Record<NavKey, PageLayout> = {
  驾驶舱: CockpitPage,
  今日: TodayPage,
  项目: ProjectsPage,
  学习: LearningPage,
  AI: AiPage,
  人际: PeoplePage,
  规划: PlanningPage,
  技能: SkillsPage,
  系统: SystemPage,
}

/**
 * 当前激活的模块 —— 渲染成三栏。
 *
 * ★ 三个栏位都是真正挂载的组件（`<Left />`），不是函数调用，
 *   所以每栏的 hooks 互不干扰。
 */
export function ActivePage() {
  const nav = useBridge((s) => s.nav)
  const layout = PAGES[nav] ?? CockpitPage
  const Left = layout.left
  const Center = layout.center
  const Right = layout.right

  return (
    <>
      {Left && <Left key={`${nav}-l`} />}
      {Center && <Center key={`${nav}-c`} />}
      {Right && <Right key={`${nav}-r`} />}
    </>
  )
}
