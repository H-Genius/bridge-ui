/**
 * 数据仓库 —— 所有读写的**唯一出口**
 * ═══════════════════════════════════════════════════════════
 *
 * ★★ 铁律：组件里不许出现 localStorage ★★
 *
 * 为什么？因为将来你想：
 *   · 从 localStorage 换成 IndexedDB
 *   · 加一个云同步
 *   · 给数据加密
 * 只需要改这一个文件，其他代码一行不用动。
 *
 * ★ 你要填的地方：随着数据模型扩展，加更多读写函数。
 */

import { emptyData, newId, type AppData } from './types'

const KEY = 'bridge-ui:data'

/* ─────────── 底层 ─────────── */

function readAll(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as Partial<AppData>
    // 补上缺失的字段 —— 数据从旧版本升上来的情况
    return { ...emptyData(), ...parsed }
  } catch (err) {
    // ★ 数据坏了也不能白屏 —— 给一份空的，并留下线索
    console.error('[repo] 数据解析失败，已回退到空数据', err)
    return emptyData()
  }
}

function writeAll(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch (err) {
    console.error('[repo] 写入失败（可能超出配额）', err)
    throw err
  }
}

/** 通用小工具：往某个集合里加/改一条 */
function upsert<K extends keyof AppData>(
  collection: K,
  item: AppData[K][number],
): AppData[K][number] {
  const data = readAll()
  // 这里把集合窄化成「一定有 id 的对象数组」。
  // 原因：collection 是动态键，TS 无法在泛型里收敛出具体类型。
  // 对外接口（下面的 repo 对象）已经用具体类型约束过了，所以调用方是安全的。
  const list = data[collection] as Array<{ id: string }>
  const i = list.findIndex((x) => x.id === (item as { id: string }).id)
  if (i >= 0) list[i] = { ...list[i], ...(item as object) }
  else list.push(item as { id: string })
  writeAll(data)
  return item
}

/** 通用小工具：从某个集合里删一条 */
function removeById<K extends keyof AppData>(collection: K, id: string): void {
  const data = readAll()
  const list = data[collection] as Array<{ id: string }>
  data[collection] = list.filter((x) => x.id !== id) as AppData[K]
  writeAll(data)
}

/* ─────────── 对外接口 ─────────── */

export const repo = {
  /** 拿到全部数据（只读快照） */
  all: readAll,

  /* ── 目标 ── */
  listGoals: () => readAll().goals,
  saveGoal: (g: Partial<AppData['goals'][number]>) =>
    upsert('goals', { ...g, id: g.id ?? newId('goal') } as AppData['goals'][number]),
  deleteGoal: (id: string) => removeById('goals', id),

  /* ── 行动 ── */
  listActions: () => readAll().actions,
  listActionsOn: (date: string) => readAll().actions.filter((a) => a.date === date),
  saveAction: (a: Partial<AppData['actions'][number]>) =>
    upsert('actions', { ...a, id: a.id ?? newId('act') } as AppData['actions'][number]),
  deleteAction: (id: string) => removeById('actions', id),

  /** 勾选 / 取消勾选。返回更新后的行动，方便调用方判断 */
  toggleAction(id: string) {
    const data = readAll()
    const a = data.actions.find((x) => x.id === id)
    if (!a) return null
    a.done = !a.done
    writeAll(data)
    return a
  },

  /* ── 项目 ── */
  listProjects: () => readAll().projects,
  saveProject: (p: Partial<AppData['projects'][number]>) =>
    upsert('projects', { ...p, id: p.id ?? newId('proj') } as AppData['projects'][number]),
  deleteProject: (id: string) => removeById('projects', id),

  /* ── 技能 ── */
  listSkills: () => readAll().skills,
  saveSkill: (s: Partial<AppData['skills'][number]>) =>
    upsert('skills', { ...s, id: s.id ?? newId('skill') } as AppData['skills'][number]),
  deleteSkill: (id: string) => removeById('skills', id),

  /* ── 学习记录 ── */
  listSessions: () => readAll().sessions,
  saveSession: (s: Partial<AppData['sessions'][number]>) =>
    upsert('sessions', { ...s, id: s.id ?? newId('ses') } as AppData['sessions'][number]),
  deleteSession: (id: string) => removeById('sessions', id),

  /* ── 人际 ── */
  listPeople: () => readAll().people,
  savePerson: (p: Partial<AppData['people'][number]>) =>
    upsert('people', { ...p, id: p.id ?? newId('per') } as AppData['people'][number]),
  deletePerson: (id: string) => removeById('people', id),

  /* ── 导入导出（设置页用） ── */
  exportJson: () => JSON.stringify(readAll(), null, 2),

  importJson(text: string) {
    const parsed = JSON.parse(text) // 解析失败会抛，交给调用方提示
    writeAll({ ...emptyData(), ...parsed })
  },

  /** 清空一切（危险操作，界面上要二次确认） */
  reset: () => writeAll(emptyData()),
}
