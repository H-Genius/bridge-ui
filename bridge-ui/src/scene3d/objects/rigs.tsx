/**
 * 相机与雾
 * ═══════════════════════════════════════════════════════════
 * 这两个都不渲染任何东西，只负责「怎么拍」和「空气有多浑」。
 *
 * CameraRig：极缓慢漂移 + 轻微跟随鼠标（视差）；有天体时视线偏向天体，
 *            并在「抵达」类状态下前推，制造接近的动势。
 * FogRig：   雾的颜色跟着天空中间色走，浓度由 StageParams.fogDensity 给出。
 */

import { useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { StageParams } from '../bridge'
import { layoutFor } from '../layout'

export function CameraRig({ params }: { params: StageParams }) {
  const { camera, pointer } = useThree()
  const layout = useMemo(() => layoutFor(params), [params.body])

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)

    // ★ 有天体时，视线中心偏向天体 —— 像飞船正在「看着」那颗星接近
    const focusX = params.body === 'none' ? 0 : layout.body[0] * 0.35
    const focusY = params.body === 'none' ? 0 : layout.body[1] * 0.35

    // 极缓慢漂移 + 轻微跟随鼠标（视差）
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      pointer.x * 6 + focusX * 0.5,
      dt * 1.4,
    )
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      pointer.y * 4 + focusY * 0.5,
      dt * 1.4,
    )
    // ★ 抵达类状态：相机整体前推一点，制造「接近」的动势
    const targetZ = 42 + params.approach * 26
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, dt * 1.2)

    camera.lookAt(focusX, focusY, -50)
  })

  return null
}

export function FogRig({ params }: { params: StageParams }) {
  const { scene } = useThree()

  const fog = useMemo(() => new THREE.FogExp2(0x0d1b2a, 0.004), [])
  useEffect(() => {
    scene.fog = fog
    return () => {
      scene.fog = null
    }
  }, [scene, fog])

  const target = useMemo(() => new THREE.Color(), [])

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    fog.density = THREE.MathUtils.lerp(fog.density, 0.003 + params.fogDensity * 0.012, dt * 2)
    target.set(params.skyMid)
    fog.color.lerp(target, dt * 2)
  })

  return null
}
