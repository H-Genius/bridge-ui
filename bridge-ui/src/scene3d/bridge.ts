/**
 * 渲染桥 —— 状态参数 → 3D 参数
 * ═══════════════════════════════════════════════════════════
 *
 * ★★ 这是解耦的关键 ★★
 *
 * 3D 世界的代码不认识 'cruising' 这种业务概念；
 * 它只认识「速度 2.4、雾 0.08」这种数字。
 * 这个文件就是那个「翻译官」：
 *   状态层说中文  →  翻译官  →  3D 层说数字
 *
 * 为什么必须有它？
 *   · 没有它：改个阈值就要动 3D 代码
 *   · 有它：只改 core/scene.ts 那张表
 *   · 而且两边可以独立验证（3D 出问题时，先看这里的输出对不对）
 */

import type { SceneSpec, SceneBody } from '@/core/scene'

export interface StageParams {
  /** 星星流动速度，1 = 正常 */
  starSpeed: number
  /** 画多少颗星 —— 由 starDensity 决定，**与速度无关** */
  starCount: number
  /**
   * ★ 运动拖尾强度 0..1。
   * 这是「高速航行」的核心视觉：同一批星星因为速度快而在屏幕上
   * 拉成光条。0 = 一个个圆点，1 = 拉到最长。
   */
  starStreak: number
  /** 尘埃光粒子的数量 */
  dustCount: number
  /** 曝光（亮度） */
  exposure: number
  /** 雾浓度 */
  fogDensity: number
  /** ★ 主天体类型 —— 'none' 时不出任何大天体 */
  body: SceneBody
  /** 空间站是否出现 */
  showStation: boolean
  /** 点缀色 */
  accent: string
  /** 天空中间色（用于雾的颜色） */
  skyMid: string

  /* ── 炫酷化新增 ───────────────────────── */

  /** ★ 星云强度 0..1.6 */
  nebula: number
  /** ★ 星云双色 */
  nebulaColors: [string, string]
  /** ★ Bloom 辉光强度 */
  bloom: number
  /** ★ 体积光强度 */
  godRays: number
  /** ★ 警示脉冲 0..1 */
  alertPulse: number
  /**
   * ★ 接近感 0..1 —— 只在「抵达新区域」这类状态打开。
   * 打开后：相机前推、天体推得更近，制造「正在接近一颗行星」的动势。
   * 0 = 远处安静地看，1 = 迎面而来。
   */
  approach: number
  /** 天体位置与大小（透传给 3D） */
  bodyX: number
  bodyY: number
  bodyScale: number
}

const DEFAULTS: StageParams = {
  starSpeed: 1,
  starCount: 12000,
  starStreak: 0,
  dustCount: 900,
  exposure: 1,
  fogDensity: 0.2,
  body: 'none',
  showStation: false,
  accent: '#4fc3f7',
  skyMid: '#0d1b2a',
  nebula: 0.6,
  nebulaColors: ['#1b3a63', '#2d5f8a'],
  bloom: 1,
  godRays: 0.3,
  alertPulse: 0,
  approach: 0,
  bodyX: 0.6,
  bodyY: 0.3,
  bodyScale: 1,
}

/**
 * 星星数量 —— ★ 固定值，不随速度变化。
 *
 * 为什么：高速航行的视觉逻辑是「**同一批**粒子被拉成光条」，
 * 而不是「凭空多出一批粒子」。数量随速度变会让状态切换时
 * 突然多出一片星，观感很假（而且和物理直觉相反）。
 *
 * 想让某些状态的天更密，请调 SceneSpec.starDensity（0..1），
 * 那是「本来就该有多少星」，和「跑多快」是两件事。
 */
function starCountFor(spec: SceneSpec): number {
  const base = 12000
  // starDensity 是场景固有属性（比如深空就该密、夜晚就该疏）
  return Math.round(base * (0.55 + spec.starDensity * 0.9))
}

/** 尘埃粒子：夜晚最少量，忙碌时最多 */
function dustCountFor(spec: SceneSpec): number {
  const base = 900
  return Math.round(base + spec.dustDensity * 5200)
}

/**
 * 运动拖尾强度：把「速度」翻译成「屏幕上的光条长度」。
 *
 * 速度 1（正常巡航）→ 0，星星是安静的点
 * 速度 2.4（高速航行）→ 约 0.72，星星明显拉成光条
 * 速度再高会饱和到 1，避免拉成糊住整个屏幕
 */
function starStreakFor(speed: number): number {
  if (speed <= 1) return 0
  // 1..3 映射到 0..1，用幂函数让「刚开始加速」就能看出变化
  return Math.min(1, Math.pow((speed - 1) / 2, 0.75))
}

/**
 * 把 core/scene.ts 的 SceneSpec 翻成 3D 认识的参数。
 * 纯函数，好测试，也好在出问题时单独打印出来比对。
 */
export function toStageParams(spec?: SceneSpec | null): StageParams {
  if (!spec) return DEFAULTS

  return {
    starSpeed: spec.starSpeed ?? 1,
    starCount: starCountFor(spec),
    starStreak: starStreakFor(spec.starSpeed ?? 1),
    dustCount: dustCountFor(spec),
    exposure: spec.brightness ?? 1,
    fogDensity: spec.fogDensity ?? 0.2,
    body: spec.body ?? 'none',
    showStation: !!spec.station,
    accent: spec.accent || '#4fc3f7',
    skyMid: spec.sky?.[1] || '#0d1b2a',
    nebula: spec.nebula ?? 0.6,
    nebulaColors: spec.nebulaColors ?? ['#1b3a63', '#2d5f8a'],
    bloom: spec.bloom ?? 1,
    godRays: spec.godRays ?? 0.3,
    alertPulse: spec.alertPulse ?? 0,
    approach: spec.approach ?? 0,
    bodyX: spec.bodyX ?? 0.6,
    bodyY: spec.bodyY ?? 0.3,
    bodyScale: spec.bodyScale ?? 1,
  }
}
