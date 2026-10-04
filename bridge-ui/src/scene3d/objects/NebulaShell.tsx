/**
 * 星云壳层 —— 悬窗最深处的彩色气体
 * ═══════════════════════════════════════════════════════════
 * 一个包住整个场景的内翻球壳，用自定义 shader 画体积感的彩色气体。
 * 不做真实体积光追 —— 用 fbm 噪声 + 背面渲染，代价极低但观感很足。
 *
 * 深空感的主要来源。强度与配色由 SceneSpec.nebula / nebulaColors 驱动。
 */

import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { StageParams } from '../bridge'

export function NebulaShell({ params }: { params: StageParams }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => new THREE.SphereGeometry(600, 48, 32), [])

  /* ★ 预分配临时 Color —— 避免每帧 new 造成 GC 压力 */
  const tmp = useMemo(() => ({ a: new THREE.Color(), b: new THREE.Color() }), [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uStrength: { value: 0.6 },
      uColorA: { value: new THREE.Color('#1b3a63') },
      uColorB: { value: new THREE.Color('#2d5f8a') },
    }),
    [],
  )

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    const m = matRef.current
    if (!m) return
    m.uniforms.uTime.value += dt * 0.06
    m.uniforms.uStrength.value = THREE.MathUtils.lerp(
      m.uniforms.uStrength.value,
      params.nebula,
      dt * 1.4,
    )
    ;(m.uniforms.uColorA.value as THREE.Color).lerp(
      tmp.a.set(params.nebulaColors[0]),
      dt * 1.2,
    )
    ;(m.uniforms.uColorB.value as THREE.Color).lerp(
      tmp.b.set(params.nebulaColors[1]),
      dt * 1.2,
    )
  })

  useEffect(() => {
    const m = matRef.current
    return () => {
      geometry.dispose()
      m?.dispose()
    }
  }, [geometry])

  return (
    <mesh geometry={geometry} scale={[-1, 1, 1]}>
      {/* scale.x = -1 把球翻了面，我们在球的内壁上看它 */}
      <shaderMaterial
        ref={matRef}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uTime;
          uniform float uStrength;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          varying vec3 vPos;

          // 三维值噪声
          float hash(vec3 p) {
            p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
          }
          float noise(vec3 x) {
            vec3 i = floor(x);
            vec3 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                  mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
              mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                  mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
              f.z
            );
          }
          float fbm(vec3 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 5; i++) {
              v += a * noise(p);
              p *= 2.02;
              a *= 0.5;
            }
            return v;
          }

          void main() {
            vec3 dir = normalize(vPos);
            // 缓慢流动的噪声场
            float n = fbm(dir * 2.6 + vec3(uTime * 0.35, uTime * 0.12, 0.0));
            float n2 = fbm(dir * 5.4 - vec3(0.0, uTime * 0.22, uTime * 0.18));

            // 云絮：把噪声压出对比，形成丝缕状的亮带
            float clouds = smoothstep(0.42, 0.92, n * 0.72 + n2 * 0.42);

            vec3 col = mix(uColorA, uColorB, clamp(n2 * 1.3, 0.0, 1.0));
            // 在银河带附近再叠一层亮芯
            float band = pow(max(0.0, 1.0 - abs(dir.y) * 2.2), 2.4);
            col += uColorB * band * 0.55 * clouds;

            gl_FragColor = vec4(col * clouds * uStrength, 1.0);
          }
        `}
      />
    </mesh>
  )
}
