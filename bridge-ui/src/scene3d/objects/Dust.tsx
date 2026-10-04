/**
 * 尘埃光粒子 —— 近处的慢速光尘
 * ═══════════════════════════════════════════════════════════
 * 和星海的区别：星海是「远、快、白」，尘埃是「近、慢、带点缀色」，
 * 两者叠加让画面有层次。
 */

import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { StageParams } from '../bridge'

export function Dust({ params }: { params: StageParams }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const { geometry } = useMemo(() => {
    const n = params.dustCount
    const positions = new Float32Array(n * 3)
    const scales = new Float32Array(n)
    const phases = new Float32Array(n)

    for (let i = 0; i < n; i += 1) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 200
      positions[i * 3 + 1] = (Math.random() - 0.5) * 140
      positions[i * 3 + 2] = (Math.random() - 0.5) * 160 + 20
      scales[i] = 0.6 + Math.random() * 2.2
      phases[i] = Math.random() * 6.28318
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    return { geometry: g }
  }, [params.dustCount])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 3.4 },
      uOpacity: { value: 0.5 },
      uAccent: { value: new THREE.Color('#4fc3f7') },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    }),
    [],
  )

  /* ★ 预分配临时 Color */
  const tmpColor = useMemo(() => new THREE.Color(), [])

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    const m = matRef.current
    if (!m) return
    m.uniforms.uTime.value += dt
    m.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      m.uniforms.uOpacity.value,
      0.32 * params.exposure,
      dt * 2,
    )
    ;(m.uniforms.uAccent.value as THREE.Color).lerp(tmpColor.set(params.accent), dt * 1.5)
  })

  useEffect(() => {
    const m = matRef.current
    return () => {
      geometry.dispose()
      m?.dispose()
    }
  }, [geometry])

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          attribute float aScale;
          attribute float aPhase;
          uniform float uTime;
          uniform float uSize;
          uniform float uPixelRatio;
          varying float vGlow;
          void main() {
            vec3 p = position;
            // 竖向缓慢上浮 + 横向摆动，像悬浮的光尘
            p.y += mod(uTime * 2.2 + aPhase * 8.0, 140.0) - 70.0;
            p.x += sin(uTime * 0.5 + aPhase) * 3.4;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float depth = clamp((-mv.z) / 300.0, 0.0, 1.0);
            vGlow = (0.35 + 0.65 * sin(uTime * 1.6 + aPhase)) * (1.0 - depth * 0.7);
            gl_PointSize = uSize * aScale * uPixelRatio * (1.0 - depth * 0.5);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uOpacity;
          uniform vec3 uAccent;
          varying float vGlow;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            if (d > 0.5) discard;
            float halo = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(uAccent, halo * halo * vGlow * uOpacity);
          }
        `}
      />
    </points>
  )
}
