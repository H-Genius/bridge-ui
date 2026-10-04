/**
 * 数据结构 —— 各层之间的共同语言
 * ═══════════════════════════════════════════════════════════
 *
 * ★ 你要填的地方：扩展这些类型，加上你自己的字段。
 *
 * ⚠️ 一个设计约定：日期一律用 'YYYY-MM-DD' 字符串，不要用 Date 对象。
 *    因为 JSON 存不了 Date，字符串最省事，排序也方便。
 */

export type Horizon = 'year' | 'quarter' | 'month' | 'week'

/** 目标 */
export interface Goal {
  id: string
  title: string
  /** 0..1 */
  progress: number
  horizon: Horizon
  /** 属于哪个领域（事业 / 健康 / …） */
  area: string
  done: boolean
  /** YYYY-MM-DD */
  due?: string
  /** 上一层目标（年 → 季） */
  parentId?: string
}

/** 行动 */
export interface Action {
  id: string
  title: string
  /** YYYY-MM-DD */
  date: string
  done: boolean
  goalId?: string
  estimateMin?: number
  /** HH:mm */
  startTime?: string
}

/** 项目 */
export interface Project {
  id: string
  name: string
  status: 'planning' | 'active' | 'paused' | 'done'
  goalIds: string[]
}

/** 技能 */
export interface Skill {
  id: string
  name: string
  /** 0..100 */
  level: number
  target?: number
}

/** 学习记录 */
export interface StudySession {
  id: string
  topic: string
  /** ISO 时间 */
  at: string
  minutes: number
}

/** 联系人 */
export interface Person {
  id: string
  name: string
  /** YYYY-MM-DD */
  lastContact?: string
  /** 多久该联系一次 */
  cadenceDays?: number
}

/** 所有数据的容器 */
export interface AppData {
  goals: Goal[]
  actions: Action[]
  projects: Project[]
  skills: Skill[]
  sessions: StudySession[]
  people: Person[]
}

/** 空数据 —— repo 在读取失败时返回它，避免白屏 */
export function emptyData(): AppData {
  return {
    goals: [],
    actions: [],
    projects: [],
    skills: [],
    sessions: [],
    people: [],
  }
}

/** 生成一个短 id（够用即可，不追求全局唯一） */
export function newId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
