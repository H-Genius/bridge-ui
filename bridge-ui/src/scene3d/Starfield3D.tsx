/**
 * 3D 悬窗 —— 用 R3F（@react-three/fiber）写
 * ═══════════════════════════════════════════════════════════
 *
 * ★ 这就是「状态驱动场景」的样子：
 *   React 状态一变，<Canvas> 里的属性跟着变，场景自动更新。
 *   你不需要写任何「同步逻辑」—— 这是 R3F 最大的价值。
 *
 * 对照纯 Three.js 的写法：那边你要自己建场景、开循环、销毁资源，
 * 还要手动把状态变化同步进去（几十行样板代码，且容易泄漏）。
 *
 * 本文件只负责**装配**，具体元素都在 objects/ 下：
 *   objects/NebulaShell.tsx    ① 星云壳层 —— 深空感来源
 *   objects/Starfield.tsx      ② 星海     —— 上万粒子，可拉成星轨
 *   objects/Dust.tsx           ③ 尘埃     —— 近处慢速光尘
 *   objects/CelestialBody.tsx  ④ 天体     —— 真实贴图的行星/卫星/气态巨行星
 *   objects/SpaceStation.tsx   ⑤ 空间站   —— 异常状态出现
 *   objects/SunSource.tsx      ⑥ 光晕源   —— GodRays 的背光锚点
 *   objects/rigs.tsx           相机与雾
 *   objects/PostFX.tsx         后处理
 *
 * 位置 / 光照由 scene3d/layout.ts 的构图系统统一给出 —— 想调构图改那个文件。
 */

import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import type { StageParams } from './bridge'

import { NebulaShell } from './objects/NebulaShell'
import { Starfield } from './objects/Starfield'
import { Dust } from './objects/Dust'
import { CelestialBody } from './objects/CelestialBody'
import { SpaceStation } from './objects/SpaceStation'
import { SunSource } from './objects/SunSource'
import { CameraRig, FogRig } from './objects/rigs'
import { PostFX } from './objects/PostFX'
import { layoutFor } from './layout'

export function Starfield3D({ params }: { params: StageParams }) {
  /** ★ GodRays 的光源 ref —— 必须在 EffectComposer 之外，否则位置更新时机不对 */
  const sunRef = useRef<THREE.Mesh>(null)

  /**
   * ★ 平行光也跟随构图 —— 之前硬编码在左上方，而行星在右下，
   *   结果行星大半在背光面，看上去就是一团黑斑。
   */
  const light = layoutFor(params).lightDir

  return (
    <Canvas
      // ★ 限制 pixelRatio，4K 屏上不设会爆
      dpr={[1, 2]}
      camera={{ fov: 58, near: 0.1, far: 1400, position: [0, 0, 42] }}
      // antialias 关掉：我们走了后处理链路，抗锯齿交给 SMAA/ToneMapping
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <FogRig params={params} />
      <CameraRig params={params} />

      {/*
        ★ 环境光压低到 0.45、平行光给 2.1：
          贴图本身已带明暗，环境光只是补一点背光面细节。
          过亮会让云和冰冠直接过曝。
      */}
      <ambientLight intensity={0.45} color="#4a5a78" />
      <directionalLight
        position={[light[0], light[1], light[2]]}
        intensity={2.1}
        color="#ffffff"
      />

      <NebulaShell params={params} />
      <Starfield params={params} />
      <Dust params={params} />
      <CelestialBody params={params} />
      <SpaceStation params={params} />
      <SunSource sunRef={sunRef} params={params} />

      <PostFX params={params} sunRef={sunRef} />
    </Canvas>
  )
}
