/**
 * AI 副官服务 —— 桌宠式（只会说，不会动手）到副官式（能改数据）
 * ═══════════════════════════════════════════════════════════
 *
 * ★ 这个文件是「接真模型」的唯一入口。
 *   UI 层（PetTerminal）只调 `askPet()`，不关心背后是本地 mock、
 *   自建后端还是第三方 API。
 *
 * ★ 现状：没有配置后端时走本地 mock，界面照常可用。
 *   想接真模型，三种接法（见 BRIDGE-UI-PLAN.md §17.6）：
 *
 *   A. 自建后端中转（推荐）
 *      后端持有 API 密钥，前端只调自己的 /api/chat。
 *      只需在 .env.local 里配 VITE_API_BASE_URL，这个文件不用改。
 *
 *   B. 用户自填密钥（仅本地自用可接受）
 *      ⚠️ 密钥会存在浏览器里，换设备要重填，且任何人打开 devtools
 *      都能看到。绝对不要用在公开部署的版本上。
 *
 *   C. 直连第三方（不推荐）
 *      密钥会硬编码进前端产物，等于公开泄露。
 *
 * ⚠️ 无论哪种：**密钥永远不要提交进 git**。
 */

import { hasBackend, http } from './api'

/** 一条对话消息 */
export interface PetMessage {
  role: 'user' | 'assistant'
  content: string
}

/** 问副官时附带的上下文（由 petContext.ts 生成） */
export interface PetAskInput {
  /** 用户这次说的话 */
  question: string
  /** 舰桥现状的自然语言描述 */
  context: string
  /** 历史对话（用于多轮） */
  history?: PetMessage[]
  /** 取消信号 —— 组件卸载时应该取消在途请求 */
  signal?: AbortSignal
}

/** 副官的回答 */
export interface PetAnswer {
  text: string
  /** 标记来源，方便调试时知道是真模型还是 mock */
  source: 'model' | 'mock'
}

/**
 * 问副官。
 *
 * ★ UI 层只调这一个函数。接真模型时改这个函数的实现即可，
 *   调用方一行不用改。
 */
export async function askPet(input: PetAskInput): Promise<PetAnswer> {
  // 没配后端 → 本地 mock，保证界面永远可用
  if (!hasBackend) {
    return { text: mockReply(input), source: 'mock' }
  }

  const res = await http.post<{ text?: string; content?: string }>(
    '/api/pet/chat',
    {
      question: input.question,
      // 上下文单独传，不要拼进 question —— 后端可能想用它做别的事
      // （比如检索你的目标库、给回答加引用）
      context: input.context,
      history: input.history ?? [],
    },
    { signal: input.signal },
  )

  return { text: res.text ?? res.content ?? '（模型没有返回内容）', source: 'model' }
}

/* ─────────── 本地 mock ─────────── */

/**
 * 没有后端时的预设回复。
 * 保留它是有意的：开发时不必起后端，界面也能完整跑通。
 */
function mockReply(input: PetAskInput): string {
  return [
    input.context,
    '',
    `（当前是本地 mock 回复，没有接模型。你问的是：「${input.question}」）`,
    '',
    '接真模型：在 .env.local 里配 VITE_API_BASE_URL，',
    '后端实现 POST /api/pet/chat 即可，前端不用改。',
  ].join('\n')
}

/* ─────────── 升级路线：副官式（能替你改数据） ─────────── */
/*
 * 桌宠式 → 副官式的区别是「能不能动手」。想升级时，建议这样设计：
 *
 *   1) 让模型返回结构化的「意图」，而不是自然语言：
 *        POST /api/pet/chat → { text: string, actions?: PetAction[] }
 *
 *   2) 定义白名单动作，前端执行前让用户确认：
 *        type PetAction =
 *          | { type: 'toggleAction'; id: string }
 *          | { type: 'addAction'; title: string; date: string }
 *          | { type: 'setGoalProgress'; id: string; progress: number }
 *
 *   3) 执行后调 store.refresh()，环境状态会自动跟着变 —— 闭环完成：
 *        副官操作 → 数据变 → 状态变 → 悬窗氛围变
 *
 * 这样设计的理由：前端持有数据读写权（data/repo.ts），
 * 模型只产出「意图」，避免把数据操作权交给一个可能出错的模型。
 */
