/**
 * 天体 —— 行星 / 卫星 / 气态巨行星
 * ═══════════════════════════════════════════════════════════
 * ★ 用真实贴图（NASA 公开行星影像）+ MeshStandardMaterial，
 *   而不是手写 shader —— 手写 shader 容易把亮部叠加到过曝，
 *   而 Three.js 的 PBR 光照是能量守恒的。
 *
 * 组成：星球本体 + 云层壳 + 大气辉光壳
 * 位置 / 尺寸 / 光照方向全部由 scene3d/layout.ts 的构图系统给出。
 */

import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { StageParams } from '../bridge'
import { layoutFor } from '../layout'
import { useBodyTextures, disposeTextures } from './bodyTextures'

export function CelestialBody({ params }: { params: StageParams }) {
  const meshRef = useRef<THREE.Mesh>(null)
  /** 云层壳的 ref —— 让它比地表转得快一点 */
  const cloudRef = useRef<THREE.Mesh>(null)
  const amount = useRef(0)
  /** 初始自转只做一次，之后交给缓慢自转 */
  const initialSpinDone = useRef(false)

  const geometry = useMemo(() => new THREE.SphereGeometry(16, 96, 64), [])

  /** ★ 统一构图 —— 位置、尺寸、光照方向都由这里决定 */
  const layout = useMemo(() => layoutFor(params), [params.body])

  /** ★ 真实贴图 */
  const maps = useBodyTextures(params.body)

  /** 有没有可用的贴图（决定走贴图还是程序化回退） */
  const hasTexture = params.body === 'planet' || params.body === 'moon'

  /** 程序化回退用的材质（只在没有贴图时启用） */
  const fallbackMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: params.body === 'gasgiant' ? '#c9a06a' : '#3f8a5c',
        roughness: 0.85,
        metalness: 0.02,
        flatShading: false,
      }),
    [params.body],
  )

  /**
   * ★ 用 MeshStandardMaterial 而不是自己写 shader：
   *   真实贴图 + 标准 PBR 光照 = 正确的明暗与质感。
   *   手写 shader 容易把亮部叠加到过曝，而 Three.js 的光照是能量守恒的。
   */
  const material = useMemo(() => {
    if (!hasTexture) return fallbackMat
    return new THREE.MeshStandardMaterial({
      map: maps.map,
      normalMap: maps.normalMap,
      roughnessMap: maps.roughnessMap,
      // ★ 夜面城市灯光：emissiveMap 只有在 emissive 非黑时才生效
      emissiveMap: maps.emissiveMap,
      emissive: maps.emissiveMap ? new THREE.Color('#ffd9a0') : new THREE.Color('#000000'),
      // 灯光亮度 —— 太亮会盖过白昼面，太暗看不见
      emissiveIntensity: maps.emissiveMap ? 1.15 : 0,
      roughness: 0.92,
      metalness: 0.0,
      // 让海洋反射一点环境色，星球才有「活」的质感
      envMapIntensity: 0.35,
    })
  }, [hasTexture, maps, fallbackMat])

  /** ★ 大气辉光壳 —— 真实行星都有边缘大气，这是「有厚度」的关键 */
  const atmosphere = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
          uColor: { value: new THREE.Color('#6fb3e8') },
          uOpacity: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec3 vNormal;
          void main() {
            // 只在外缘亮：法线越「侧对」观察者越亮
            float rim = pow(1.0 - abs(vNormal.z), 3.2);
            gl_FragColor = vec4(uColor, rim * uOpacity * 0.75);
          }
        `,
      }),
    [],
  )

  /** 同步大气颜色（副作用放 effect，不在渲染期改 uniform） */
  useEffect(() => {
    atmosphere.uniforms.uColor.value = new THREE.Color(
      params.body === "planet" ? "#5fa8e8" : params.body === "gasgiant" ? "#c9a06a" : "#8b98a8",
    )
  }, [params.body, atmosphere])

  /** ★ 云层材质 —— 独立的一层半透明球壳，比地表略快自转 */
  const cloudMaterial = useMemo(() => {
    if (!maps.cloudsMap) return null
    return new THREE.MeshStandardMaterial({
      map: maps.cloudsMap,
      alphaMap: maps.cloudsMap,
      transparent: true,
      opacity: 0.9,
      // 云接受光照 —— 否则暗面也会亮，看着假
      roughness: 1.0,
      metalness: 0.0,
      depthWrite: false,
    })
  }, [maps.cloudsMap])

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    const m = meshRef.current
    if (!m) return

    const visible = params.body !== 'none'

    // 出现时从远处推近、由小变大
    amount.current = THREE.MathUtils.lerp(
      amount.current,
      visible ? 1 : 0,
      dt * (visible ? 1.8 : 2.6),
    )
    m.visible = amount.current > 0.01
    if (!m.visible) return

    // ★ 抵达时天体推得更近更大 —— 「迎面而来」而不是远处挂个小球
    const proximity = 1 + params.approach * 0.85
    m.scale.setScalar((0.45 + amount.current * 0.55) * params.bodyScale * layout.bodyScale * proximity)

    // ★ 位置由统一构图系统给出
    const target = layout.body
    const targetZ = target[2] + params.approach * 62
    m.position.z = THREE.MathUtils.lerp(m.position.z, targetZ, dt * 1.6)
    m.position.x = THREE.MathUtils.lerp(m.position.x, target[0], dt * 1.6)
    m.position.y = THREE.MathUtils.lerp(m.position.y, target[1], dt * 1.6)

    // ★ 初始自转角度：让地球的「陆地那一面」朝向相机。
    //   贴图是等距圆柱投影，默认朝向会让太平洋正对镜头 ——
    //   看上去整颗星全是蓝色海洋，没有大陆，就很假。
    //   这里转到亚欧/非洲大陆那一片。
    if (!initialSpinDone.current) {
      m.rotation.y = params.body === "planet" ? -2.15 : params.body === "moon" ? -0.6 : 0
      initialSpinDone.current = true
    }

    // 自转：慢速，像在悬停观察（太快会转离大陆，又变成一片海）
    m.rotation.y += dt * (params.body === "moon" ? 0.012 : 0.018)

    // 大气辉光跟随出现进度
    atmosphere.uniforms.uOpacity.value = amount.current

    // ★ 云层比地表转得稍快，形成「云在飘」的相对运动
    if (cloudRef.current) {
      cloudRef.current.rotation.y += dt * 0.006
    }
  })

  /** ★ 卸载时释放 —— 贴图、几何体、材质都要还回 GPU */
  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
      atmosphere.dispose()
      cloudMaterial?.dispose()
      fallbackMat.dispose()
      disposeTextures(maps)
    }
  }, [geometry, material, atmosphere, fallbackMat, maps])

  return (
    <group ref={meshRef} position={[58, 22, -380]} visible={false}>
      {/* 星球本体 */}
      <mesh geometry={geometry} material={material} />
      {/* ★ 云层壳：比地表略大，并且转得稍快一点，产生「云在飘」的层次 */}
      {cloudMaterial && <mesh geometry={geometry} material={cloudMaterial} scale={1.012} ref={cloudRef} />}
      {/* 大气辉光壳：略微放大一圈 */}
      <mesh geometry={geometry} material={atmosphere} scale={1.035} />
    </group>
  )
}
