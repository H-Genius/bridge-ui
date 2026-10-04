/**
 * 3D 场景的数值常量
 * ═══════════════════════════════════════════════════════════
 * ★ 想调 3D 观感先从这里入手 —— 这些是纯数值，不影响任何逻辑。
 *
 * 注意区分两类参数：
 *   · 这里的常量 = 物理尺度（视野范围、星海推进速度），调一次就够
 *   · StageParams = 随环境状态变化的（速度、密度、光照），由 bridge.ts 给出
 */

const MAX_STARS = 26000
const SPREAD_X = 460
const SPREAD_Y = 280
const SPREAD_Z = 680
const DRIFT_SPEED = 26

export const STAR_CONSTANTS = {
  MAX_STARS,
  SPREAD_X,
  SPREAD_Y,
  SPREAD_Z,
  DRIFT_SPEED,
}
