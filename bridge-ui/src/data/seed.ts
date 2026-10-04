/**
 * 种子数据 —— 首次运行时填进去的示例
 * ═══════════════════════════════════════════════════════════
 *
 * ★ 你要填的地方：把这里换成你自己真实的目标和行动。
 *   它是「首次打开时看到什么」的答案。
 *
 * 只在 repo 里一条数据都没有时才会写入。
 */

import { emptyData, type AppData } from './types'
import { todayKey } from '@/core/derive'

function ago(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function seedData(): AppData {
  const today = todayKey()
  const data = emptyData()

  /* ── 目标 ── */
  data.goals = [
    { id: 'goal_1', title: '季度复盘', progress: 0.6, horizon: 'quarter', area: '事业', done: false },
    { id: 'goal_2', title: '读完《系统之美》', progress: 0.35, horizon: 'month', area: '学习', done: false },
    { id: 'goal_3', title: '把吉他捡回来', progress: 0.2, horizon: 'year', area: '生活', done: false },
  ]

  /* ── 今天的行动 ── */
  data.actions = [
    { id: 'act_1', title: '复盘 Q3 的三个关键决定', date: today, done: true, startTime: '09:30', goalId: 'goal_1' },
    { id: 'act_2', title: '读《系统之美》第 4 章', date: today, done: true, startTime: '11:00', goalId: 'goal_2' },
    { id: 'act_3', title: '整理本周学习笔记', date: today, done: false, startTime: '14:00' },
    { id: 'act_4', title: '给老张回消息', date: today, done: false, startTime: '17:30' },
    { id: 'act_5', title: '练 30 分钟吉他', date: today, done: false, startTime: '21:00', goalId: 'goal_3' },
    // 几条历史逾期，用来演示 warning 状态
    { id: 'act_6', title: '提交报销单', date: ago(3), done: false },
    { id: 'act_7', title: '整理书架', date: ago(5), done: false },
  ]

  /* ── 项目 ── */
  data.projects = [
    { id: 'proj_1', name: '个人知识库重构', status: 'active', goalIds: ['goal_2'] },
    { id: 'proj_2', name: 'Q3 复盘文档', status: 'active', goalIds: ['goal_1'] },
    { id: 'proj_3', name: '吉他练习计划', status: 'planning', goalIds: ['goal_3'] },
  ]

  /* ── 技能 ── */
  data.skills = [
    { id: 'skill_1', name: '系统思考', level: 62, target: 80 },
    { id: 'skill_2', name: '写作', level: 74, target: 90 },
    { id: 'skill_3', name: '吉他', level: 28, target: 60 },
    { id: 'skill_4', name: '英语口语', level: 55, target: 75 },
  ]

  /* ── 学习记录 ── */
  data.sessions = [
    { id: 'ses_1', topic: '系统思考', at: new Date(Date.now() - 3600e3).toISOString(), minutes: 50 },
    { id: 'ses_2', topic: '写作', at: new Date(Date.now() - 26 * 3600e3).toISOString(), minutes: 35 },
    { id: 'ses_3', topic: '吉他', at: new Date(Date.now() - 50 * 3600e3).toISOString(), minutes: 30 },
  ]

  /* ── 人际 ── */
  data.people = [
    { id: 'per_1', name: '老张', lastContact: ago(30), cadenceDays: 14 },
    { id: 'per_2', name: '小林', lastContact: ago(3), cadenceDays: 14 },
    { id: 'per_3', name: '陈老师', lastContact: ago(45), cadenceDays: 30 },
  ]

  return data
}
