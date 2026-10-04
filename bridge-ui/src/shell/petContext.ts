/**
 * 副官的上下文构建器
 * ═══════════════════════════════════════════════════════════
 *
 * ★ 这是「副官」区别于「普通聊天框」的灵魂 ★
 *
 * 它把「舰桥现在长什么样」翻译成一段自然语言，喂给模型。
 * 没有它，AI 只能泛泛而谈；有了它，AI 才知道你在哪。
 *
 * ★ 你要填的地方：加上你想让副官知道的更多信息。
 *   原则：**短**。不要把整个数据库塞进去，只给结论。
 */

import { useBridge } from '@/state/store'
import { AMBIENCE_LABEL } from '@/core/ambience'

/** 每种状态对应一句「处境描述」 */
const MOOD: Record<string, string> = {
  calm: '舰桥处于平稳航行状态，一切正常。',
  cruising: '任务负载偏高，我们正在高速航行。',
  arrival: '目标达成，已抵达新区域。',
  night: '现在是夜间值班，照明已降低。',
  warning: '舰桥有环境警示：逾期任务偏多。',
}

/**
 * 构建一段给模型的上下文。
 * 注意它读的是 zustand store —— 所以在组件里调用即可，
 * 不要放在模块顶层（那时 store 还没就绪）。
 */
export function buildPetContext(): string {
  const { ambience, actionsToday, overdue, focusGoal } = useBridge.getState()

  const done = actionsToday.filter((a) => a.done).length
  const todo = actionsToday.filter((a) => !a.done).map((a) => a.title)

  const parts = [
    MOOD[ambience] ?? `当前状态：${AMBIENCE_LABEL[ambience]}。`,
    `今天已完成 ${done} 项，待办 ${todo.length} 项${todo.length ? `（${todo.slice(0, 3).join('、')}${todo.length > 3 ? '…' : ''}）` : ''}。`,
    overdue > 0 ? `有 ${overdue} 项已经逾期。` : '',
    focusGoal
      ? `当前重点目标：「${focusGoal.title}」，进度 ${Math.round(focusGoal.progress * 100)}%。`
      : '',
  ]

  return parts.filter(Boolean).join('\n')
}
