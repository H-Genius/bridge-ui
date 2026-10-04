/**
 * 可拖拽面板 hook
 * ═══════════════════════════════════════════════════════════
 * 让一个固定定位的面板可以用鼠标拖着走。
 *
 * 设计要点：
 *   · 位置用「距右下角的偏移」表示 —— 因为面板默认锚在右下，
 *     用右下锚点才不会被窗口缩放搞乱
 *   · 拖拽中直接改 transform，不触发 React 重渲染（性能）
 *   · 松手才写 localStorage，避免拖动时疯狂写盘
 *   · 拖拽把手和点击是分开的：把手上的点击不会误触发折叠
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface DragPos {
  /** 距右边界的像素 */
  right: number
  /** 距下边界的像素 */
  bottom: number
}

interface Options {
  /** localStorage 的键名 */
  storageKey: string
  /** 默认位置 */
  initial: DragPos
  /** 边界留白（px） */
  margin?: number
  /**
   * ★ 是否吸附左右两侧。
   * 打开后：松手时面板会滑向最近的一侧边缘，永远不居中 ——
   * 中央是悬窗的主视野，不能被面板挡住。
   */
  snapToSides?: boolean
  /** 面板宽度（用于计算吸附后的 right 值） */
  panelWidth?: number
}

export function useDraggablePanel({
  storageKey,
  initial,
  margin = 16,
  snapToSides = false,
  panelWidth = 356,
}: Options) {
  const [pos, setPos] = useState<DragPos>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return initial
      const p = JSON.parse(raw) as DragPos
      if (typeof p.right === 'number' && typeof p.bottom === 'number') return p
    } catch {
      /* 存储损坏就用默认值 */
    }
    return initial
  })

  const [dragging, setDragging] = useState(false)
  /** 拖拽过程中的实时位移（用 ref 避免每帧重渲染） */
  const dragState = useRef<{
    startX: number
    startY: number
    startRight: number
    startBottom: number
    moved: boolean
  } | null>(null)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // 只响应左键 / 触摸
      if (e.button !== 0) return
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startRight: pos.right,
        startBottom: pos.bottom,
        moved: false,
      }
      setDragging(true)
    },
    [pos.right, pos.bottom],
  )

  useEffect(() => {
    if (!dragging) return

    function onMove(e: PointerEvent) {
      const d = dragState.current
      if (!d) return

      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true

      // 向右拖 = right 变小；向上拖 = bottom 变大
      const nextRight = clamp(d.startRight - dx, margin, window.innerWidth - panelWidth - margin)
      const nextBottom = clamp(d.startBottom + dy, margin, window.innerHeight - 80)
      setPos({ right: nextRight, bottom: nextBottom })
    }

    function onUp() {
      setDragging(false)
      dragState.current = null
      // 松手才持久化，并做吸附
      setPos((p) => {
        const final = snapToSides ? snapRight(p, margin, panelWidth) : p
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(final))
        } catch {
          /* 隐私模式等场景静默失败 */
        }
        return final
      })
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragging, margin, storageKey, snapToSides, panelWidth])

  /** 重置回默认位置 */
  const reset = useCallback(() => {
    setPos(initial)
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      /* ignore */
    }
  }, [initial, storageKey])

  return { pos, dragging, handlePointerDown, wasDragging: () => dragState.current?.moved ?? false, reset }
}

/**
 * ★ 吸附到最近的一侧。
 * 用面板中心的 x 坐标判断它更靠近哪边，然后贴到那一侧的边缘。
 */
function snapRight(p: DragPos, margin: number, panelWidth: number): DragPos {
  const vw = window.innerWidth
  // 当前面板中心的 x（从左算）
  const centerX = vw - p.right - panelWidth / 2
  const goLeft = centerX < vw / 2
  return {
    right: goLeft ? vw - panelWidth - margin : margin,
    bottom: p.bottom,
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), Math.max(lo, hi))
}
