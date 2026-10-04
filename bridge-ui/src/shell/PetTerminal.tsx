/**
 * AI 副官终端 —— 桌宠式（只会说，不会动手）
 * ═══════════════════════════════════════════════════════════
 * 形态：悬浮小面板，**可以拖着走**（抓手在标题栏），可折叠成圆点。
 *
 * ★ 它和普通聊天框的唯一区别：**知道上下文**。
 *   普通聊天框："你好，有什么可以帮你的？"
 *   带上上下文："舰桥在平稳航行。今天 5 项任务还剩 3 项…"
 *
 * ★ 你要填的地方：
 *   · 接真模型 → 在 reply() 里换成 fetch 调用
 *   · ⚠️ API 密钥绝不能写在前端代码里（前端代码是公开的）
 *     正确做法：让用户自己在设置里填，或走一个自己的小后端中转
 * 想升级成「副官式」（能替你改数据）？见 BRIDGE-UI-PLAN.md §17.5
 */

import { useState, useRef, useEffect } from 'react'
import { useBridge } from '@/state/store'
import { buildPetContext } from './petContext'
import { useDraggablePanel } from './useDraggablePanel'
import { askPet, ApiError, type PetMessage } from '@/services'

interface Msg {
  role: 'user' | 'ai'
  text: string
}

/** 默认位置：右下角 */
const DEFAULT_POS = { right: 20, bottom: 112 }

export function PetTerminal() {
  const petOpen = useBridge((s) => s.petOpen)
  const togglePet = useBridge((s) => s.togglePet)

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  /** 在途请求的中止器 —— 卸载或连续提问时取消上一个 */
  const abortRef = useRef<AbortController>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const { pos, dragging, handlePointerDown, wasDragging, reset } = useDraggablePanel({
    storageKey: 'bridge-ui:pet-pos',
    initial: DEFAULT_POS,
    // ★ 松手吸附到左右两侧，永远不居中（中央是悬窗主视野）
    snapToSides: true,
    panelWidth: 356,
  })

  /* 首次打开时给一句「带上上下文」的问值 */
  useEffect(() => {
    if (msgs.length === 0 && petOpen) {
      setMsgs([{ role: 'ai', text: buildPetContext() }])
    }
  }, [petOpen, msgs.length])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })
  }, [msgs])

  /** 卸载时取消在途请求，避免对已卸载组件 setState */
  useEffect(() => () => abortRef.current?.abort(), [])

  async function send() {
    const text = draft.trim()
    if (!text) return
    setDraft('')

    // 带上历史（多轮对话用）
    const history: PetMessage[] = msgs.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }))
    // 取消上一个还没回来的请求，避免旧回复盖住新回复
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setMsgs((m) => [...m, { role: 'user', text }])
    setThinking(true)

    try {
      const answer = await askPet({
        question: text,
        context: buildPetContext(),
        history,
        signal: abortRef.current?.signal,
      })
      setMsgs((m) => [...m, { role: 'ai', text: answer.text }])
    } catch (err) {
      // 取消不算错误（组件卸载、连续提问时的主动中止）
      if (err instanceof ApiError && err.message.includes('取消')) return
      setMsgs((m) => [
        ...m,
        { role: 'ai', text: `副官暂时联系不上：${(err as Error).message}` },
      ])
    } finally {
      setThinking(false)
    }
  }

  /** 折叠时也要能拖 —— 点击与拖拽分开判断 */
  function handleCircleClick() {
    if (wasDragging()) return
    togglePet()
  }

  const positionStyle = { right: pos.right, bottom: pos.bottom } as const

  /** ★ 拖拽中不加过渡（跟随鼠标），松手后加过渡（吸附滑入两侧） */
  const moveTransition = dragging
    ? 'none'
    : 'right 0.32s cubic-bezier(0.22, 1, 0.36, 1), bottom 0.32s cubic-bezier(0.22, 1, 0.36, 1)'

  return (
    <>
      {/* 折叠态的圆点 */}
      {!petOpen && (
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onClick={handleCircleClick}
          title="AI 副官（可拖动）"
          className="glass fixed z-20 grid size-12 cursor-move place-items-center rounded-full select-none"
          style={{
            ...positionStyle,
            transition: dragging
              ? 'none'
              : `${moveTransition}, background var(--dur) var(--ease)`,
            touchAction: 'none',
          }}
        >
          <span
            className="pointer-events-none size-2.5 rounded-full"
            style={{
              background: 'var(--color-accent)',
              boxShadow: '0 0 12px var(--color-accent)',
              animation: 'breathe 2.4s ease-in-out infinite',
            }}
          />
        </button>
      )}

      {/* 展开态的面板 */}
      {petOpen && (
        <div
          className="glass fixed z-20 flex max-h-[min(460px,58vh)] w-[min(356px,26vw)] min-w-[280px] flex-col overflow-hidden"
          style={{
            ...positionStyle,
            background: 'rgba(16,19,24,.72)',
            // 拖拽时给一点视觉反馈：放大微阴影
            boxShadow: dragging
              ? '0 18px 48px rgba(0,0,0,.62), inset 0 1px 0 rgba(255,255,255,.1)'
              : undefined,
            transition: dragging
              ? 'none'
              : `${moveTransition}, box-shadow var(--dur) var(--ease)`,
          }}
        >
          {/* 头 —— 钛灰条，同时是**拖拽把手** */}
          <div
            onPointerDown={handlePointerDown}
            className="gauge-titanium flex items-center justify-between border-b border-white/10 px-3.5 py-2.5 select-none"
            style={{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
            title="按住拖动"
          >
            <div className="flex items-center gap-2 text-[12.5px]">
              {/* 拖拽把手提示 */}
              <svg viewBox="0 0 10 16" className="size-2.5 shrink-0 opacity-45" fill="currentColor">
                <circle cx="2" cy="3" r="1.2" />
                <circle cx="8" cy="3" r="1.2" />
                <circle cx="2" cy="8" r="1.2" />
                <circle cx="8" cy="8" r="1.2" />
                <circle cx="2" cy="13" r="1.2" />
                <circle cx="8" cy="13" r="1.2" />
              </svg>
              <span
                className="size-2.5 rounded-full"
                style={{
                  background: 'var(--color-accent)',
                  boxShadow: '0 0 10px var(--color-accent)',
                  animation: 'breathe 2.4s ease-in-out infinite',
                }}
              />
              AI 副官
            </div>

            <div className="flex items-center gap-1">
              {/* 位置复位 */}
              <button
                type="button"
                onClick={reset}
                title="回到默认位置"
                className="cursor-pointer px-1 text-[13px] leading-none text-white/45 transition-colors hover:text-white/90"
              >
                ⌂
              </button>
              <button
                type="button"
                onClick={togglePet}
                title="收起"
                className="cursor-pointer px-0.5 text-lg leading-none text-white/45 transition-colors hover:text-white/90"
              >
                ×
              </button>
            </div>
          </div>

          {/* 对话区 */}
          <div ref={bodyRef} className="flex min-h-20 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`text-[12.5px] leading-relaxed ${
                  m.role === 'user' ? 'text-right text-white/62' : 'text-white/94'
                }`}
              >
                <span className="mb-0.5 block text-[9.5px] tracking-[0.14em] text-white/42 uppercase">
                  {m.role === 'user' ? '你' : '副官'}
                </span>
                <span className="whitespace-pre-line">{m.text}</span>
              </div>
            ))}

            {/* ★ 请求在途时的反馈 —— 接了真模型后响应有延迟，必须让用户知道 */}
            {thinking && (
              <div className="text-[12.5px] leading-relaxed text-white/62">
                <span className="mb-0.5 block text-[9.5px] tracking-[0.14em] text-white/42 uppercase">
                  副官
                </span>
                <span className="inline-flex items-center gap-1">
                  <i
                    className="size-1.5 rounded-full"
                    style={{
                      background: 'var(--color-accent)',
                      animation: 'breathe 1.2s ease-in-out infinite',
                    }}
                  />
                  正在推演…
                </span>
              </div>
            )}
          </div>

          {/* 输入 */}
          <div
            className="flex gap-1.5 border-t border-white/10 p-2.5"
            // 输入区不该触发拖拽
            onPointerDown={(e) => e.stopPropagation()}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !thinking && send()}
              placeholder="给副官下指令…"
              disabled={thinking}
              className="flex-1 rounded-lg border border-white/13 bg-white/5 px-2.5 py-1.5 text-[12.5px] text-white/94 transition-colors outline-none placeholder:text-white/36 focus:border-[var(--color-accent)] disabled:opacity-50"
            />
            <button
              type="button"
              onClick={send}
              disabled={thinking}
              className="cursor-pointer rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition hover:brightness-110 disabled:cursor-default disabled:opacity-50"
              style={{ background: 'var(--color-accent)', color: '#04121c' }}
            >
              发送
            </button>
          </div>
        </div>
      )}
    </>
  )
}