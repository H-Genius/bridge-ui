/**
 * 把环境状态写进 CSS 变量的 hook
 * ═══════════════════════════════════════════════════════════
 *
 * 这是「状态 → 视觉」在 React 里的接法：
 *   · 组件不直接写样式
 *   · 而是把状态翻译成一组 CSS 变量
 *   · CSS 负责过渡动画
 *
 * 好处：JS 一行动画代码都不用写，而且换皮肤只改 CSS。
 */

import { useEffect, useMemo } from 'react'
import { useBridge } from '@/state/store'
import { sceneFor } from '@/core/scene'
import { toStageParams, type StageParams } from '@/scene3d/bridge'

/** #4fc3f7 → rgba(79,195,247,0.35) */
function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/**
 * 把当前环境状态同步到 :root 的 CSS 变量上。
 * 同时返回 3D 场景要的参数，避免重复计算。
 */
export function useAmbienceVars(): StageParams {
  const ambience = useBridge((s) => s.ambience)
  const spec = useMemo(() => sceneFor(ambience), [ambience])
  const params = useMemo(() => toStageParams(spec), [spec])

  useEffect(() => {
    const r = document.documentElement.style
    r.setProperty('--sky-a', spec.sky[0])
    r.setProperty('--sky-b', spec.sky[1])
    r.setProperty('--sky-c', spec.sky[2])
    r.setProperty('--sky-brightness', String(spec.brightness))
    r.setProperty('--star-opacity', String(spec.starOpacity))
    r.setProperty('--star-duration', `${spec.starDuration}s`)

    // ★ 天体出现时 CSS 兜底层也亮起来（3D 不可用时的降级行星）
    r.setProperty('--planet-opacity', spec.body === 'none' ? '0' : '1')
    r.setProperty('--station-opacity', String(spec.station))
    // ★ 新增：星云双色 —— CSS 层的氛围光斑读它们
    r.setProperty('--nebula-a', spec.nebulaColors[0])
    r.setProperty('--nebula-b', spec.nebulaColors[1])
    r.setProperty('--nebula-strength', String(spec.nebula))

    // ★ 新增：尘埃粒子密度与警示脉冲
    r.setProperty('--dust-density', String(spec.dustDensity))
    // 尘埃流动一圈的秒数：越快越「忙」
    r.setProperty('--dust-duration', `${Math.round(72 - spec.starSpeed * 18)}s`)
    r.setProperty('--alert-pulse', String(spec.alertPulse))
    r.setProperty('--bloom-strength', String(spec.bloom))

    // ★ 新增：天体的 CSS 兜底位置（跟随 3D 里的构图）
    r.setProperty('--body-x', `${50 + spec.bodyX * 34}%`)
    r.setProperty('--body-y', `${50 + spec.bodyY * 30}%`)

    r.setProperty('--accent-dim', hexToRgba(spec.accent, 0.35))
    // 点缀色本身也覆盖 —— 让强调色随状态变
    r.setProperty('--color-accent', spec.accent)
  }, [spec])

  return params
}
