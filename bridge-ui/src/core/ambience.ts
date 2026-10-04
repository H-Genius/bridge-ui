/**
 * 环境状态机 —— 整个应用的心脏
 * ═══════════════════════════════════════════════════════════
 *
 * 这是**纯函数**：给同样的输入，永远算出同样的结果。
 * 没有副作用、不碰 DOM、不碰存储 —— 所以能单独测试。
 *
 * ★ 你要填的地方：TUNING 里的阈值，和 deriveAmbience() 的判断顺序。
 */

/** 环境状态：系统当前的心情 */
export type Ambience = 'calm' | 'cruising' | 'arrival' | 'night' | 'warning'

/**
 * 所有可调阈值集中在这里。
 * 别把它们散到代码各处 —— 那样以后改不动。
 */
export const TUNING = {
  /** 刚完成目标后的「庆祝窗口」（分钟）。这段时间内显示 arrival */
  celebrateWindowMin: 15,

  /** 逾期到这个数就发警示 */
  warningOverdueThreshold: 5,

  /** 深夜时段（24 小时制，左闭右开） */
  nightFrom: 1,
  nightTo: 5,

  /**
   * 忙碌判定的两个阈值。
   * ★ 两个值不同 = 迟滞（hysteresis），防止状态在边界反复横跳。
   */
  busyEnterRatio: 0.5,
  busyExitRatio: 0.35,
} as const

export interface AmbienceInput {
  /** 现在几点 */
  now: Date
  /** 今天的行动 */
  actionsToday: Array<{ done: boolean }>
  /** 逾期数量 */
  overdueCount: number
  /** 最近一次完成目标的时间 */
  lastCompletedAt?: Date
  /** 上一次的状态（用于迟滞） */
  previous?: Ambience
}

/**
 * 算出当前的环境状态。
 *
 * ⚠️ 判断顺序很重要，不是随便排的：
 *   ① 完成（喜悦优先于一切 —— 凌晨刚完成也该庆祝）
 *   ② 异常（堆积太多，要提醒）
 *   ③ 深夜（时间的自然属性）
 *   ④ 忙碌 / 平稳（由任务量决定）
 */
export function deriveAmbience(input: AmbienceInput): Ambience {
  const {
    now,
    actionsToday = [],
    overdueCount = 0,
    lastCompletedAt,
    previous,
  } = input

  // ① 完成 —— 喜悦优先
  if (
    lastCompletedAt &&
    minutesBetween(lastCompletedAt, now) < TUNING.celebrateWindowMin
  ) {
    return 'arrival'
  }

  // ② 异常 —— 堆积太多
  if (overdueCount >= TUNING.warningOverdueThreshold) {
    return 'warning'
  }

  // ③ 深夜
  const hour = now.getHours()
  if (hour >= TUNING.nightFrom && hour < TUNING.nightTo) {
    return 'night'
  }

  // ④ 忙碌 / 平稳 —— 带迟滞
  const total = actionsToday.length
  const remaining = actionsToday.filter((a) => !a.done).length
  const ratio = total === 0 ? 0 : remaining / total

  const wasBusy = previous === 'cruising'
  const isBusy = wasBusy
    ? ratio >= TUNING.busyExitRatio // 已经在忙碌：要掉到更低才退出
    : ratio >= TUNING.busyEnterRatio // 本来不忙：要涨到更高才进入

  return isBusy ? 'cruising' : 'calm'
}

function minutesBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 60000
}

/* ─────────── 给 UI 用的文案 ─────────── */

export const AMBIENCE_LABEL: Record<Ambience, string> = {
  calm: '平稳航行',
  cruising: '高速航行',
  arrival: '抵达新区域',
  night: '静谧深空',
  warning: '环境警示',
}

export const AMBIENCE_LOG: Record<Ambience, string> = {
  calm: '进入平稳航行状态',
  cruising: '检测到任务负载上升，进入高速航行',
  arrival: '目标达成，抵达新区域',
  night: '进入夜间值班，降低照明',
  warning: '逾期任务偏多，舰桥发出环境警示',
}
