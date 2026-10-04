/**
 * 后处理 —— 把画面「夸张化」
 * ═══════════════════════════════════════════════════════════
 * Bloom（辉光）+ GodRays（体积光）+ Vignette（暗角）
 * + Noise（噪点）+ ToneMapping（色调映射）。
 *
 * ⚠️ 几个踩过的坑：
 *   · GodRays 需要 <EffectComposer autoClear={false}>，否则遮挡关系算错
 *   · 色调映射用 NEUTRAL 而不是 ACES_FILMIC —— ACES 会把画面大幅降饱和
 *     并压暗，实测会让真实行星贴图变成一团灰（海洋不再是蓝的）
 *   · 光源 ref 必须在 EffectComposer **之外**维护，位置更新时机才对
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  GodRays,
  Vignette,
  Noise,
  ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import type { StageParams } from '../bridge'

export function PostFX({
  params,
  sunRef,
}: {
  params: StageParams
  sunRef: React.RefObject<THREE.Mesh | null>
}) {
  const bloomRef = useRef<{ intensity: number } | null>(null)
  const raysRef = useRef<{ blendMode: { opacity: { value: number } } } | null>(null)

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    // Bloom 强度随状态平滑变化
    const b = bloomRef.current
    if (b) {
      b.intensity = THREE.MathUtils.lerp(b.intensity, params.bloom, dt * 1.5)
    }
    // ★ 体积光强度也随状态变化 —— 深夜几乎无光晕，抵达新区域时最强
    const r = raysRef.current
    if (r?.blendMode?.opacity) {
      r.blendMode.opacity.value = THREE.MathUtils.lerp(
        r.blendMode.opacity.value,
        Math.min(1, params.godRays),
        dt * 1.2,
      )
    }
  })

  return (
    <EffectComposer
      multisampling={0}
      frameBufferType={THREE.HalfFloatType}
      renderPriority={1}
      // ★ GodRays 会额外渲染一遍做遮挡，必须关掉自动清屏，
      // 否则遮挡关系算错（postprocessing 会在控制台警告）
      autoClear={false}
    >
      <Bloom
        ref={bloomRef as never}
        mipmapBlur
        intensity={params.bloom}
        luminanceThreshold={0.16}
        luminanceSmoothing={0.42}
        radius={0.92}
        levels={9}
      />
      <GodRays
        ref={raysRef as never}
        sun={sunRef as React.RefObject<THREE.Mesh>}
        density={0.96}
        decay={0.94}
        weight={0.42}
        exposure={0.32}
        clampMax={1}
        blur
      />
      <Vignette offset={0.24} darkness={0.72} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.045} />
        {/* ★ 用 NEUTRAL 而不是 ACES_FILMIC：ACES 会把画面大幅降饱和并压暗，
            实测会让真实行星贴图变成一团灰（海洋不再是蓝的）。 */}
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  )
}
