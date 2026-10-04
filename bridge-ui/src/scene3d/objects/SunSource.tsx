/**
 * 光晕源 —— GodRays 需要一个真实存在于场景中的 mesh 当光源
 * ═══════════════════════════════════════════════════════════
 * 这个 mesh 本身不该被看见（它只是光斑锚点），所以 visible=false：
 * postprocessing 仍能用它做遮挡计算与位置投影，
 * 但不会在主画面里渲染出这个球。
 *
 * 位置由构图系统给出，始终压在天体后方形成背光。
 */

import { useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { StageParams } from '../bridge'
import { sunPositionFor } from '../layout'

export function SunSource({
  sunRef,
  params,
}: {
  sunRef: React.RefObject<THREE.Mesh | null>
  params: StageParams
}) {
  const { camera } = useThree()

  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: 0xdff1ff }),
    [],
  )

  useEffect(() => () => material.dispose(), [material])

  const tmpPos = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    const m = sunRef.current
    if (!m) return
    // ★ 平滑跟随天体位置 —— 天体是从远处推近 + 横向移动的，
    // 光源要跟着走，背光才会一直「挂」在天体背后。
    const target = sunPositionFor(params)
    tmpPos.set(target[0], target[1], target[2])
    m.position.lerp(tmpPos, dt * 1.6)
    m.lookAt(camera.position)
  })

  return (
    <mesh
      ref={sunRef}
      material={material}
      position={sunPositionFor(params)}
      visible={false}
    >
      <sphereGeometry args={[9, 20, 20]} />
    </mesh>
  )
}
