/**
 * AI
 * ═══════════════════════════════════════════════════════════
 * 这个模块是「AI 副官」的完整版页面（右下角那个是快捷入口）。
 *
 * ★ 你要填的地方：接真模型。
 * ⚠️ API 密钥不能写在前端代码里 —— 前端代码是公开的。
 *    正确做法：让用户自己在设置里填（存本地），
 *    或走一个自己的小后端中转。
 */

import { Panel } from '@/components/Panel'
import { useBridge } from '@/state/store'
import { AMBIENCE_LABEL } from '@/core/ambience'


export function AiPageLeft() {
  const ambience = useBridge((s) => s.ambience)
  const actionsToday = useBridge((s) => s.actionsToday)
  const focusGoal = useBridge((s) => s.focusGoal)

  return (
      <aside className="flex min-h-0 flex-col gap-3.5">
        <Panel title="副官看到的上下文">
          <p className="text-[12px] leading-relaxed text-white/62">
            它知道你现在处于「{AMBIENCE_LABEL[ambience]}」，
            今天有 {actionsToday.length} 项任务，
            重点目标是「{focusGoal?.title ?? '暂无'}」。
          </p>
          <p className="mt-2.5 text-[11px] leading-relaxed text-white/55">
            这段文字就是它区别于普通聊天框的地方。
            见 shell/petContext.ts。
          </p>
        </Panel>
      </aside>
  )
}

export function AiPageCenter() {

  return (
      <section className="relative flex min-h-0 flex-col items-center justify-center gap-3 text-center">
        <div
          className="pointer-events-none absolute inset-0 -z-1"
          style={{
            background:
              'radial-gradient(48% 42% at 50% 50%, color-mix(in srgb, var(--color-accent) 9%, transparent) 0%, transparent 70%)',
          }}
        />
        <div className="text-[10px] tracking-[0.22em] text-white/55 uppercase">AI</div>
        <h1
          className="text-[clamp(24px,3.2vw,44px)] font-medium"
          style={{ textShadow: '0 2px 30px rgba(0,0,0,.65)' }}
        >副官待命</h1>
        <p className="max-w-[30ch] text-[13px] text-white/62">
          点右下角的圆点打开对话。想接真模型，改
          <code className="mx-1 rounded bg-white/8 px-1 font-mono text-[11px]">
            PetTerminal.tsx
          </code>
          里的 reply()。
        </p>
      </section>
  )
}

export function AiPageRight() {

  return (
      <aside className="flex min-h-0 flex-col gap-3.5">
        <Panel title="升级路线">
          <Step n={1} text="桌宠式：会说话，不会动手 ← 现在这里" done />
          <Step n={2} text="带上更多上下文（目标、技能、人际）" />
          <Step n={3} text="加工具：能替你改数据" />
          <Step n={4} text="闭环：副官操作 → 状态变 → 氛围变" />
        </Panel>
      </aside>
  )
}

export const AiPage = { left: AiPageLeft, center: AiPageCenter, right: AiPageRight }
function Step({ n, text, done }: { n: number; text: string; done?: boolean }) {
  return (
    <div className="mb-3 flex gap-2.5 last:mb-0">
      <span
        className="mt-px grid size-4.5 shrink-0 place-items-center rounded-full font-mono text-[10px]"
        style={{
          background: done ? 'var(--color-accent)' : 'rgba(255,255,255,.1)',
          color: done ? '#04121c' : 'rgba(255,255,255,.62)',
          boxShadow: done ? '0 0 10px var(--accent-dim)' : 'none',
        }}
      >
        {n}
      </span>
      <span className="text-[12px] leading-snug" style={{ opacity: done ? 1 : 0.6 }}>
        {text}
      </span>
    </div>
  )
}