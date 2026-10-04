/**
 * 系统 —— 设置
 * ═══════════════════════════════════════════════════════════
 * ★ 你要填的地方：
 *   · 状态阈值可调（逾期几个算异常、几点算深夜）
 *   · API 密钥（如果接了模型）
 *   · 主题切换
 *
 * ⚠️ 危险操作（清空数据）一定要二次确认。
 *
 * 实现说明：三栏是三个独立组件，共享的「数据操作」逻辑抽到
 * useDataOps() 里，避免在每一栏各复制一份（那会导致各栏状态不同步）。
 */

import { useCallback, useRef, useState } from 'react'
import { useBridge } from '@/state/store'
import { Panel } from '@/components/Panel'
import { repo } from '@/data/repo'
import { TUNING } from '@/core/ambience'

/**
 * 数据导入 / 导出 / 清空 —— 三栏共享同一份逻辑。
 * 注意：每栏各调用一次这个 hook 会得到各自独立的状态，
 * 所以「消息提示」只显示在真正触发了操作的那一栏。
 */
function useDataOps() {
  const refresh = useBridge((s) => s.refresh)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  /** 导出：下载一个 json 文件 */
  const exportData = useCallback(() => {
    const blob = new Blob([repo.exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bridge-ui-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('已导出')
  }, [])

  /** 导入：读文件 → 解析 → 写入 */
  const importData = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          repo.importJson(String(reader.result))
          refresh()
          setMsg('导入成功')
        } catch {
          setMsg('导入失败：文件格式不对')
        }
      }
      reader.readAsText(file)
    },
    [refresh],
  )

  /** 清空：二次确认 */
  const resetAll = useCallback(() => {
    if (!window.confirm('确定要清空所有数据吗？这个操作无法撤销。')) return
    repo.reset()
    refresh()
    setMsg('已清空')
  }, [refresh])

  return { fileRef, msg, exportData, importData, resetAll }
}

export function SystemPageLeft() {
  const { fileRef, msg, exportData, importData, resetAll } = useDataOps()

  return (
    <aside className="flex min-h-0 flex-col gap-3.5">
      <Panel title="数据">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={exportData}
            className="glass cursor-pointer rounded-lg px-3 py-2 text-left text-[12px] transition hover:bg-white/8"
          >
            导出为 JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="glass cursor-pointer rounded-lg px-3 py-2 text-left text-[12px] transition hover:bg-white/8"
          >
            从 JSON 导入
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={importData}
            className="hidden"
          />
          <button
            type="button"
            onClick={resetAll}
            className="cursor-pointer rounded-lg border border-red-400/30 px-3 py-2 text-left text-[12px] text-red-300/90 transition hover:bg-red-400/10"
          >
            清空所有数据
          </button>
          {msg && <p className="text-[11px] text-white/55">{msg}</p>}
        </div>
      </Panel>
    </aside>
  )
}

export function SystemPageCenter() {
  const data = useBridge((s) => s.data)
  const total =
    data.goals.length + data.actions.length + data.projects.length + data.skills.length

  return (
    <section className="relative flex min-h-0 flex-col items-center justify-center gap-3 text-center">
      <div
        className="pointer-events-none absolute inset-0 -z-1"
        style={{
          background:
            'radial-gradient(48% 42% at 50% 50%, color-mix(in srgb, var(--color-accent) 9%, transparent) 0%, transparent 70%)',
        }}
      />
      <div className="text-[10px] tracking-[0.22em] text-white/55 uppercase">系统</div>
      <h1
        className="text-[clamp(24px,3.2vw,44px)] font-medium"
        style={{ textShadow: '0 2px 30px rgba(0,0,0,.65)' }}
      >
        {total}
        <span className="ml-1 text-[0.4em] text-white/55">条记录</span>
      </h1>
      <p className="max-w-[30ch] text-[13px] text-white/62">
        数据存在浏览器本地，换设备用左边的导出 / 导入。
      </p>
    </section>
  )
}

export function SystemPageRight() {
  const data = useBridge((s) => s.data)

  return (
    <aside className="flex min-h-0 flex-col gap-3.5">
      <Panel title="数据统计">
        <Row label="目标" value={data.goals.length} />
        <Row label="行动" value={data.actions.length} />
        <Row label="项目" value={data.projects.length} />
        <Row label="技能" value={data.skills.length} />
        <Row label="学习记录" value={data.sessions.length} />
        <Row label="联系人" value={data.people.length} />
      </Panel>

      <Panel title="状态阈值">
        <div className="text-[11px] leading-relaxed text-white/62">
          逾期 ≥ {TUNING.warningOverdueThreshold} 项 → 环境警示
          <br />
          深夜 {TUNING.nightFrom}:00 – {TUNING.nightTo}:00
          <br />
          忙碌阈值 {TUNING.busyEnterRatio} / 退出 {TUNING.busyExitRatio}
        </div>
        <p className="mt-2 text-[10px] text-white/55">
          改这些值：src/core/ambience.ts 的 TUNING
        </p>
      </Panel>
    </aside>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2 flex justify-between text-[12px] last:mb-0">
      <span className="text-white/62">{label}</span>
      <b className="font-mono font-normal text-white/94">{value}</b>
    </div>
  )
}

export const SystemPage = {
  left: SystemPageLeft,
  center: SystemPageCenter,
  right: SystemPageRight,
}
