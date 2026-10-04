/**
 * 空间站 —— 异常状态出现
 * ═══════════════════════════════════════════════════════════
 * 位置由构图系统给出，永远在主天体的另一侧（避免两者同框堆叠）。
 */

import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { StageParams } from '../bridge'
import { layoutFor } from '../layout'

export function SpaceStation({ params }: { params: StageParams }) {
  const groupRef = useRef<THREE.Group>(null)
  const amount = useRef(0)

  const hull = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x93a6bb,
        roughness: 0.45,
        metalness: 0.78,
      }),
    [],
  )
  const glow = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x66e0ff,
        transparent: true,
        opacity: 0.95,
      }),
    [],
  )

  /** ★ 统一构图 —— 空间站的位置由构图系统给出，永远在主体的另一侧 */
  const layout = useMemo(() => layoutFor(params), [params.body])
  const tmpPos = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    const g = groupRef.current
    if (!g) return

    amount.current = THREE.MathUtils.lerp(amount.current, params.showStation ? 1 : 0, dt * 1.8)
    g.visible = amount.current > 0.01
    if (!g.visible) return

    g.rotation.y += dt * 0.14

    // ★ 位置交给构图系统（不再硬编码 y），并保留缓慢的悬浮感
    const st = layout.station
    tmpPos.set(st[0], st[1] + Math.sin(clock.elapsedTime * 0.5) * 1.8, st[2])
    g.position.lerp(tmpPos, dt * 1.6)

    g.scale.setScalar(0.95 * (0.88 + amount.current * 0.12))
  })

  useEffect(
    () => () => {
      hull.dispose()
      glow.dispose()
    },
    [hull, glow],
  )

  return (
    <group ref={groupRef} position={[-66, 28, -180]} visible={false}>
      {/* 主桁架 */}
      <mesh material={hull}>
        <boxGeometry args={[52, 2.6, 2.6]} />
      </mesh>
      {/* 中心舱 */}
      <mesh material={hull}>
        <cylinderGeometry args={[3.6, 3.6, 15, 18]} />
      </mesh>
      {/* 旋转环 */}
      <mesh material={hull} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[9.5, 0.8, 10, 44]} />
      </mesh>
      {/* 两端太阳能板 */}
      <mesh material={hull} position={[24, 0, 0]}>
        <boxGeometry args={[1.3, 8, 5.6]} />
      </mesh>
      <mesh material={hull} position={[-24, 0, 0]}>
        <boxGeometry args={[1.3, 8, 5.6]} />
      </mesh>
      {/* ★ 舷窗灯 —— 让空间站「活着」而不是一块铁 */}
      {[-8, 0, 8].map((x) => (
        <mesh key={`p${x}`} material={glow} position={[x, 0, 3.0]}>
          <sphereGeometry args={[0.55, 10, 10]} />
        </mesh>
      ))}
      <mesh material={glow} position={[0, 7.5, 0]}>
        <sphereGeometry args={[0.8, 12, 12]} />
      </mesh>
    </group>
  )
}
