/**
 * 悬窗 —— 3D 星空场景 + CSS 降级
 * ═══════════════════════════════════════════════════════════
 * 层级（从下到上）：
 *   ① 天空渐变（CSS，也是 3D 失败时的降级底色）
 *   ② 星云光斑层（CSS，喂「深空彩色气体」的氛围）
 *   ③ 3D 画布（R3F）—— 或 CSS 假星空
 *   ④ 舷窗内框光晕（viewport-frame）
 *
 * ★ 这样分层的原因见 BRIDGE-UI-PLAN.md 的 §9.2：
 *   直接模糊 3D 画布会让每帧全屏采样，是性能悬崖。
 */

import { Suspense, lazy } from 'react'
import type { StageParams } from '@/scene3d/bridge'

/* ★ 懒加载 3D —— 它体积大（three + postprocessing 约 1MB），别拖慢首屏 */
const Starfield3D = lazy(() =>
  import('@/scene3d/Starfield3D').then((m) => ({ default: m.Starfield3D })),
)

export function Window({ params }: { params: StageParams }) {
  return (
    <div className="sky-gradient fixed inset-0 z-0 overflow-hidden">
      {/* ① 星云光斑 —— 大范围彩色气体，深空感的主要来源 */}
      <div className="nebula-wash pointer-events-none absolute -inset-[20%]" />

      {/* ② 3D 画布。加载失败时下面的 CSS 星点就是降级 */}
      <Suspense fallback={<div className="css-stars absolute -inset-[60%]" />}>
        <Starfield3D params={params} />
      </Suspense>

      {/* ③ 天体的 CSS 兜底：3D 可用时被画布盖住，看不出区别 */}
      <div
        className="pointer-events-none absolute rounded-full transition-opacity duration-[2.2s]"
        style={{
          left: 'var(--body-x)',
          top: 'var(--body-y)',
          width: 'clamp(140px, 16vw, 260px)',
          aspectRatio: '1',
          background: 'radial-gradient(circle at 32% 30%, #8fc4ff, #2a5490 55%, #0a1830)',
          boxShadow: '0 0 100px 24px rgba(90,160,255,.22)',
          opacity: 'var(--planet-opacity)',
        }}
      />

      {/* ④ 舷窗内框光晕 —— 厚玻璃舷窗的边界感 */}
      <div className="viewport-frame pointer-events-none absolute inset-0" />

      {/* ⑤ 警示脉冲 —— 异常状态下整个画面轻微呼吸 */}
      <div
        className="alert-breath pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 50%, transparent 55%, color-mix(in srgb, var(--color-accent) 30%, transparent) 100%)',
        }}
      />
    </div>
  )
}
