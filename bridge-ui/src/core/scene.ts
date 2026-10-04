/**
 * 场景映射 —— 状态 → 视觉参数
 * ═══════════════════════════════════════════════════════════
 *
 * ★★ 这是你最常改的文件 ★★
 *
 * 想改观感？只改这里。不要动任何逻辑代码。
 * 想加一个新状态？在 SCENES 里加一个键，再去 core/ambience.ts
 * 的 deriveAmbience() 里加判断。
 *
 * 这些值会同时喂给两处：
 *   · CSS 变量（theme 层读它们）
 *   · 3D 场景（scene3d/bridge.ts 翻译它们）
 */

import type { Ambience } from './ambience'

/** 悬窗外的主天体类型 —— 决定 3D 里出现什么 */
export type SceneBody = 'none' | 'planet' | 'moon' | 'gasgiant'

export interface SceneSpec {
  /** 展示名 */
  label: string
  /** [顶, 中, 底] 三色渐变 */
  sky: [string, string, string]
  /** 整体亮度 0..1.5 */
  brightness: number
  /** CSS 星点层的透明度（降级时用） */
  starOpacity: number
  /** CSS 星点移动一圈的秒数（越大越慢） */
  starDuration: number
  /** 3D 星星速度，1 = 正常 */
  starSpeed: number
  /** 雾浓度 0..1 */
  fogDensity: number
  /** ★ 主天体：决定远处出现行星 / 卫星 / 气态巨行星 / 未来城市 / 空间站 */
  body: SceneBody
  /** 空间站是否出现（可与主天体叠加） */
  station: 0 | 1
  /** 点缀色（少量使用！） */
  accent: string

  /* ── 以下为「炫酷化」新增参数 ───────────────────────── */

  /** ★ 星云强度 0..1.6 —— 远处的彩色气体云，是深空感的主要来源 */
  nebula: number
  /** ★ 星云主色（会被 accent 稍作染色） */
  nebulaColors: [string, string]
  /** ★ 星空固有密度 0..1 —— **与速度无关**，表示「这片天本来有多少星」 */
  starDensity: number
  /** ★ 尘埃 / 光粒子数量（CSS 层用的密度系数 0..1） */
  dustDensity: number
  /** ★ 辉光强度 0..2.5 —— 后处理 Bloom 的强度 */
  bloom: number
  /** ★ 体积光强度 0..1.5 —— 天体背光的 GodRays */
  godRays: number
  /** ★ 环境警示脉冲 0..1 —— 异常状态下画面轻微呼吸闪烁 */
  alertPulse: number
  /**
   * ★ 接近感 0..1 —— 只在「抵达新区域」这类状态打开。
   * 打开后相机前推、天体推近，做出「正在接近一颗行星」的动势，
   * 而不是在远处挂一个小球。
   */
  approach: number
  /** 天体在画面中的横向位置 -1..1（-1 最左，1 最右） */
  bodyX: number
  /** 天体在画面中的纵向位置 -1..1 */
  bodyY: number
  /** 天体视觉大小系数 0.4..2 */
  bodyScale: number
}

export const SCENES: Record<Ambience, SceneSpec> = {
  /* ── 平稳：安静星海，缓慢运行的天体 ── */
  calm: {
    label: '平稳航行',
    sky: ['#0a1420', '#0d1b2a', '#060a12'],
    brightness: 1,
    starOpacity: 0.55,
    starDuration: 160,
    starSpeed: 1,
    fogDensity: 0.18,
    body: 'moon',
    station: 0,
    accent: '#4fc3f7',
    nebula: 0.55,
    nebulaColors: ['#1b3a63', '#2d5f8a'],
    starDensity: 0.62,
    dustDensity: 0.45,
    bloom: 0.9,
    godRays: 0.25,
    alertPulse: 0,
    approach: 0,
    bodyX: 0.62,
    bodyY: 0.3,
    bodyScale: 0.75,
  },

  /* ── 忙碌：高速航行，星星拉成星轨 ── */
  cruising: {
    label: '高速航行',
    sky: ['#0b1a2c', '#123249', '#050a14'],
    brightness: 1.08,
    starOpacity: 0.8,
    starDuration: 46,
    starSpeed: 2.4, // ★ 这个值一大，星星就拉成线
    fogDensity: 0.08,
    body: 'none',
    station: 1,
    accent: '#29b6f6',
    nebula: 0.85,
    nebulaColors: ['#12405f', '#1f6f9c'],
    starDensity: 0.62,
    dustDensity: 0.9,
    bloom: 1.5,
    godRays: 0.35,
    alertPulse: 0,
    approach: 0,
    bodyX: 0,
    bodyY: 0,
    bodyScale: 1,
  },

  /* ── 完成：抵达新的行星区域 ── */
  arrival: {
    label: '抵达新区域',
    sky: ['#10243a', '#1b3f5c', '#070d18'],
    brightness: 1.14,
    starOpacity: 0.55,
    starDuration: 175,
    starSpeed: 1.05,
    fogDensity: 0.16,
    body: 'planet',
    station: 1,
    accent: '#81c784',
    nebula: 0.75,
    nebulaColors: ['#20504a', '#2f7a63'],
    starDensity: 0.7,
    dustDensity: 0.6,
    bloom: 1.35,
    godRays: 1.1,
    alertPulse: 0,
    approach: 1,
    bodyX: -0.5,
    bodyY: -0.22,
    bodyScale: 1.25,
  },

  /* ── 深夜：整体压暗，只剩微光 ── */
  night: {
    label: '静谧深空',
    sky: ['#05080e', '#070c16', '#020306'],
    brightness: 0.38,
    starOpacity: 0.32,
    starDuration: 320,
    starSpeed: 0.35,
    fogDensity: 0.5,
    body: 'none',
    station: 0,
    accent: '#5c6bc0',
    nebula: 0.9,
    nebulaColors: ['#1a1f45', '#2a2f63'],
    starDensity: 0.42,
    dustDensity: 0.3,
    bloom: 1.2,
    godRays: 0.12,
    alertPulse: 0,
    approach: 0,
    bodyX: 0,
    bodyY: 0,
    bodyScale: 1,
  },

  /* ── 异常：空间站出现，色调转橙，画面轻微警示脉冲 ── */
  warning: {
    label: '环境警示',
    sky: ['#1a1410', '#2a1e14', '#0a0705'],
    brightness: 0.92,
    starOpacity: 0.45,
    starDuration: 200,
    starSpeed: 0.9,
    fogDensity: 0.3,
    body: 'none',
    station: 1,
    accent: '#ffb74d',
    nebula: 0.6,
    nebulaColors: ['#5a3418', '#7a4a1e'],
    starDensity: 0.5,
    dustDensity: 0.5,
    bloom: 1.4,
    godRays: 0.3,
    alertPulse: 1,
    approach: 0,
    bodyX: 0,
    bodyY: 0,
    bodyScale: 1,
  },
}

/** 取一个状态参数，找不到就给 calm（保证永远有值可渲染） */
export function sceneFor(ambience: Ambience): SceneSpec {
  return SCENES[ambience] ?? SCENES.calm
}

/** 所有状态的键，按展示顺序（给状态切换器用） */
export const AMBIENCE_ORDER = Object.keys(SCENES) as Ambience[]