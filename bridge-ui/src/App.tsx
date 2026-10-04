/**
 * 根组件 —— 组装外壳 + 当前页
 * ═══════════════════════════════════════════════════════════
 * 这是整个应用的装配点。它只做三件事：
 *   ① 把环境状态同步进 CSS 变量
 *   ② 渲染悬窗（背景）
 *   ③ 渲染外壳（顶栏 / 三栏 / 控制台）+ 当前模块
 *
 * ★ 你要填的地方：如果想加一个全新的模块，在
 *   state/store.ts 的 NAV_ITEMS 加名字，
 *   在 pages/ 下建对应组件，然后在 pages/index.ts 里注册。
 */

import { useAmbienceVars } from '@/shell/useAmbienceVars'
import { Window } from '@/shell/Window'
import { TopBar } from '@/shell/TopBar'
import { Console } from '@/shell/Console'
import { PetTerminal } from '@/shell/PetTerminal'
import { ActivePage } from '@/pages'
import { useBridge } from '@/state/store'
import { useEffect } from 'react'

export default function App() {
  const params = useAmbienceVars()
  const pushLog = useBridge((s) => s.pushLog)

  // 启动时记一条日志，并启动时钟
  useEffect(() => {
    pushLog('舰桥系统就绪')
    const t = setInterval(() => {
      // 每 30 秒重算一次环境状态（时间的自然流逝也算变化）
      useBridge.getState().recomputeAmbience()
    }, 30_000)
    return () => clearInterval(t)
  }, [pushLog])

  return (
    <>
      {/* ① 悬窗：3D 场景（背景） */}
      <Window params={params} />

      {/* ② 静态渐变层 + 扫描线 —— 磨砂面板模糊的是这一层，不是画布 */}
      <div
        className="pointer-events-none fixed inset-0 z-1"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255,255,255,.015), rgba(255,255,255,.075))',
        }}
      />
      <div className="scanlines pointer-events-none fixed inset-0 z-1" />

      {/* ③ 动态光粒子 —— 飘在整个界面之上，给画面「呼吸」 */}
      <div className="dust-field pointer-events-none fixed inset-0 z-1" />

      {/* ④ 舰桥界面 */}
      <div className="relative z-2 flex h-full flex-col gap-3.5 p-4">
        <TopBar />
        <main className="grid min-h-0 flex-1 grid-cols-[minmax(200px,20vw)_1fr_minmax(200px,20vw)] gap-3.5">
          <ActivePage />
        </main>
        <Console />
      </div>

      {/* ⑤ AI 副官（右下角浮层） */}
      <PetTerminal />
    </>
  )
}
