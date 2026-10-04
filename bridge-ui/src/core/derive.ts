/**
 * 各种推导 —— 把原始数据算成「结论」
 * ═══════════════════════════════════════════════════════════
 *
 * 这一层也是纯函数。职责是把 repo 里的原始记录，
 * 算成界面和状态机需要的那几个数字。
 *
 * ★ 你要填的地方：随着数据模型变复杂，这里会增加更多推导函数。
 */

import type { Action, Person } from '@/data/types'

/** 今天是哪一天，格式 YYYY-MM-DD（本地时间，不用 UTC，避免差一天） */
export function todayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** 今天的行动 */
export function actionsOn(actions: Action[], dateKey = todayKey()): Action[] {
  return actions.filter((a) => a.date === dateKey)
}

/** 逾期数量：未完成、且日期早于今天 */
export function overdueCount(actions: Action[], dateKey = todayKey()): number {
  return actions.filter((a) => !a.done && a.date < dateKey).length
}

/** 完成进度 0..1 */
export function completionRatio(actions: Action[]): number {
  if (actions.length === 0) return 0
  return actions.filter((a) => a.done).length / actions.length
}

/**
/** 多久没联系了，返回天数；没记录则返回 null */
export function daysSince(dateStr?: string): number | null {
  if (!dateStr) return null
  const then = new Date(`${dateStr}T00:00:00`)
  return Math.floor((Date.now() - then.getTime()) / 86400000)
}

/** 该联系谁：超过自己设定的周期还没联系的 */
export function whoToReachOut(people: Person[]): Person[] {
  return people.filter((p) => {
    if (!p.cadenceDays) return false
    const d = daysSince(p.lastContact)
    return d === null || d >= p.cadenceDays
  })
}

/** 按小时格式化成 HH:mm */
export function hhmm(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}
