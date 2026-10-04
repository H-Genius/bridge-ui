/**
 * 星海 —— 悬窗的主体
 * ═══════════════════════════════════════════════════════════
 * 上万颗粒子沿 z 轴飞向相机。
 *
 * ★ 高速航行的视觉逻辑是「同一批粒子被拉成光条」，
 *   而不是「凭空多出一批粒子」—— 所以粒子数由 starDensity
 *   决定（场景固有属性），拖尾长度由 starStreak 决定（速度）。
 */

import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { StageParams } from '../bridge'
import { STAR_CONSTANTS } from './constants'

export function Starfield({ params }: { params: StageParams }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  /**
   * ★ 当前实际绘制的星数 —— 平滑跟随目标值，避免 setDrawRange 硬跳。
   * 初值给 1 而非 0：若插值首帧尚未推进，0 会导致 setDrawRange(0,0)
   * 一颗星都不画（观感上就是黑屏）。
   */
  const visibleCount = useRef(1)

  /** ★ 预分配临时 Color，避免每帧 new */
  const tmpTint = useMemo(() => new THREE.Color(), [])

  /* 几何体只建一次 —— 不要每次渲染都重建，那是性能杀手 */
  const { geometry, speeds } = useMemo(() => {
    const positions = new Float32Array(STAR_CONSTANTS.MAX_STARS * 3)
    const scales = new Float32Array(STAR_CONSTANTS.MAX_STARS)
    const speeds = new Float32Array(STAR_CONSTANTS.MAX_STARS)

    for (let i = 0; i < STAR_CONSTANTS.MAX_STARS; i += 1) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * STAR_CONSTANTS.SPREAD_X
      positions[i * 3 + 1] = (Math.random() - 0.5) * STAR_CONSTANTS.SPREAD_Y
      positions[i * 3 + 2] = (Math.random() - 0.5) * STAR_CONSTANTS.SPREAD_Z - 60
      scales[i] = 0.5 + Math.random() * 1.6
      speeds[i] = 0.5 + Math.random()
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    return { geometry: g, speeds }
  }, [])

  const uniforms = useMemo(
    () => ({
      uSize: { value: 2.6 },
      uOpacity: { value: 0.8 },
      uStreak: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uTime: { value: 0 },
      uTint: { value: new THREE.Color('#ffffff') },
    }),
    [],
  )

  /* 每帧：只更新「随时间变化」的部分 */
  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    const g = geometry
    const pos = g.attributes.position as THREE.BufferAttribute

    // ★ 粒子数平滑过渡 —— setDrawRange 是硬切换，直接跳会看到星星「突然多出来」
    visibleCount.current = THREE.MathUtils.lerp(
      visibleCount.current,
      params.starCount,
      dt * 1.6,
    )
    const count = Math.round(visibleCount.current)
    g.setDrawRange(0, count)

    // 星海沿 z 轴推进（像向前飞）
    const speed = params.starSpeed
    for (let i = 0; i < count; i += 1) {
      let z = pos.getZ(i) + dt * STAR_CONSTANTS.DRIFT_SPEED * speed * speeds[i]
      if (z > 250) z -= STAR_CONSTANTS.SPREAD_Z // 越界回到远端
      pos.setZ(i, z)
    }
    pos.needsUpdate = true

    // ★ 用 lerp 平滑过渡 —— 状态切换时不会「跳」
    const m = matRef.current
    if (m) {
      m.uniforms.uTime.value += dt
      const targetOpacity = 0.45 * params.exposure * (0.75 + speed * 0.25)
      m.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        m.uniforms.uOpacity.value,
        targetOpacity,
        dt * 3,
      )

      // ★ 拖尾强度：这是「高速航行」的核心视觉载体。
      // 过渡稍慢一点，让「加速」和「减速」读起来像在拉长/收拢。
      m.uniforms.uStreak.value = THREE.MathUtils.lerp(
        m.uniforms.uStreak.value,
        params.starStreak,
        dt * 2.2,
      )

      // 星色跟着点缀色走一点，让不同状态的星空有微妙的色温差
      ;(m.uniforms.uTint.value as THREE.Color).lerp(tmpTint.set(params.accent), dt * 1.2)
    }
  })

  /* ★ 卸载时释放资源 —— Three.js 不会自动回收 */
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
          uniform float uSize;
          uniform float uStreak;
          uniform float uPixelRatio;
          uniform float uTime;
          varying float vAlpha;
          varying float vTwinkle;
          varying vec2 vDir;      // ★ 屏幕空间的运动方向（拖尾方向）
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;

            // ── 运动方向 ──
            // 星星沿 z 轴飞向相机，投影到屏幕上就是「从中心向外辐射」。
            // 用点自身在屏幕上的位置方向作为拖尾方向，视觉上最接近真实运动模糊。
            vec2 ndc = gl_Position.xy / max(gl_Position.w, 0.0001);
            float len = length(ndc);
            // 越靠画面中心，方向越不稳定，给个安全回退
            vDir = len > 0.001 ? normalize(ndc) : vec2(0.0, 1.0);

            // 越远的星越小越暗 —— 这是景深的来源
            float depth = clamp((-mv.z) / 700.0, 0.0, 1.0);
            vAlpha = mix(0.95, 0.28, depth);
            // ★ 每颗星按自己的相位闪烁，画面立刻「活」起来
            float phase = position.x * 0.07 + position.y * 0.11;
            vTwinkle = 0.62 + 0.38 * sin(uTime * 2.4 + phase * 6.28318);

            // ★ 基础尺寸保持小 —— 高速时是「拉长」而不是「变大」
            // ★ 基础尺寸
            float size = uSize * aScale * (1.0 - depth * 0.55);

            // ★ 关键：点的**物理尺寸**必须跟着拖尾一起变大，
            // 否则 fragment 里画不出光条（gl_PointCoord 始终是 0..1 的方点，
            // 点不够大就只能画出被裁掉的碎片 → 整屏黑）。
            // 纵向拉长、横向只略微加粗，这样才是「细光条」而不是「胖方块」。
            float scaleUp = 1.0 + uStreak * 9.0;
            gl_PointSize = size * uPixelRatio * scaleUp * (0.85 + vTwinkle * 0.3);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uOpacity;
          uniform float uStreak;
          uniform vec3 uTint;
          varying float vAlpha;
          varying float vTwinkle;
          varying vec2 vDir;

          void main() {
            // 把点坐标转到「以拖尾方向为纵轴」的局部坐标系
            vec2 p = gl_PointCoord - 0.5;

            // ★ 拖尾总长度：uStreak=0 时是正圆；=1 时纵向拉到约 24 倍。
            // 横向刻意保持很细，这样才是「光条」而不是「胖方块」。
            float streakLen = 1.0 + uStreak * 23.0;
            float halfW = 0.5;

            // 沿运动方向拉伸、垂直方向收细
            vec2 along = vDir;
            vec2 across = vec2(-vDir.y, vDir.x);
            float s = dot(p, along) * streakLen;   // 纵向（拖尾方向）坐标
            float t = dot(p, across) / max(0.35, 1.0 - uStreak * 0.35); // 横向（变细）

            // 椭圆距离：横向半径 0.5，纵向半径 0.5
            float d = length(vec2(t, s / 1.0) / vec2(0.5, 0.5));
            if (d > 1.0) discard;

            // ── 亮度分布 ──
            // streak<=0（静止）：平滑圆点，亮芯 + 柔光晕
            // streak>0（高速）：头部亮、尾部渐隐，这才是「速度感」的来源
            float bright;
            if (uStreak < 0.02) {
              float core = smoothstep(0.5, 0.0, length(p));
              float halo = smoothstep(0.5, 0.15, length(p)) * 0.5;
              bright = core + halo;
            } else {
              // s 在 [-0.5, 0.5]：-0.5 是尾部，+0.5 是头部
              float head = smoothstep(-0.5, 0.42, s);   // 尾→头 渐亮
              float body = pow(head, 1.6);
              // 横向细长的亮芯
              float acrossFall = smoothstep(1.0, 0.0, abs(t) * 2.0);
              bright = body * acrossFall;
              // 头部再点一颗亮点，像星核
              float node = smoothstep(0.5, 0.0, length(p * vec2(1.0, 1.0) - vDir * 0.34));
              bright += node * 0.55;
            }

            vec3 col = mix(vec3(0.72, 0.85, 1.0), vec3(1.0), vTwinkle) * uTint;
            // 拖尾越长越淡，避免整屏糊成一片
            float fade = 1.0 - uStreak * 0.45;
            gl_FragColor = vec4(col, bright * vAlpha * uOpacity * vTwinkle * fade);
          }
        `}
      />
    </points>
  )
}
