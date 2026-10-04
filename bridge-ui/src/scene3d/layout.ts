/**
 * 统一构图系统
 * ═══════════════════════════════════════════════════════════
 *
 * ★ 为什么要有它：
 *   早先每个 3D 元素都硬编码自己的坐标，结果是
 *     · 天体和空间站可能落在同一区域 → 堆叠
 *     · 光源和天体对不上 → 体积光从旁边擦过去，脱节
 *   现在改成「先定主体，其余按相对关系排布」，
 *   元素之间自然会错开，光照方向也一致。
 *
 * ★ 想调整天体在画面里的位置 / 大小 / 光照方向，只改这张表。
 */

import * as THREE from 'three'
import type { SceneBody } from '@/core/scene'
import type { StageParams } from './bridge'

export interface Layout {
  /** 主天体位置 */
  body: [number, number, number]
  /** 空间站位置 —— 永远在主体的另一侧 */
  station: [number, number, number]
  /** 体积光光源 —— 压在主体后方 */
  sun: [number, number, number]
  /** 主体尺寸系数（气态巨行星该更大） */
  bodyScale: number
  /**
   * ★ 平行光方向（从哪边照过来）。
   * 必须和主体位置匹配：光在左、主体在右 → 主体会只剩一道边缘亮，
   * 看起来像一团黑斑。这里是「让主体大部分被照亮」的方向。
   */
  lightDir: [number, number, number]
}

export const LAYOUT: Record<SceneBody, Layout> = {
  // 无主体：空间站独占左侧，光从右上来，画面留白给星海
  none: {
    body: [0, 0, -160],
    station: [-62, 20, -138],
    sun: [46, 34, -190],
    bodyScale: 1,
    lightDir: [0.45, 0.42, 0.79],
  },
  // 类地行星：主体偏右下，光从左上前方照 —— 让球体大部分入光
  planet: {
    body: [40, -18, -150],
    station: [-66, 30, -140],
    sun: [40, -18, -215],
    bodyScale: 1.35,
    // ★ 关键：光要「朝向观察者这一侧」，这样我们看到的才是被照亮的面
    lightDir: [-0.32, 0.4, 0.86],
  },
  // 卫星：主体偏右上，光从右前方照
  moon: {
    body: [52, 22, -150],
    station: [-68, -22, -140],
    sun: [52, 22, -215],
    bodyScale: 1.0,
    lightDir: [0.3, 0.34, 0.89],
  },
  // 气态巨行星：体积大，主体占右下
  gasgiant: {
    body: [30, -26, -190],
    station: [-72, 34, -150],
    sun: [30, -26, -260],
    bodyScale: 1.7,
    lightDir: [-0.24, 0.38, 0.89],
  },
}

/** 取当前状态的构图 */
export function layoutFor(params: StageParams): Layout {
  return LAYOUT[params.body] ?? LAYOUT.none
}

/**
 * 光晕源位置 —— ★ 由构图系统给出，始终压在主体后方。
 *
 * 体积光（GodRays）的意义就是「背光」。如果光源固定在某个角落、
 * 而行星在别处，光束就会从行星旁边擦过去，穿帮。
 */
export function sunPositionFor(params: StageParams): [number, number, number] {
  return layoutFor(params).sun
}

/** 把构图里的光照方向写成 Vector3（供 shader uniform 用） */
export function lightVectorFor(params: StageParams): THREE.Vector3 {
  const [x, y, z] = layoutFor(params).lightDir
  return new THREE.Vector3(x, y, z).normalize()
}
