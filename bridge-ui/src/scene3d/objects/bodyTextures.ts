/**
 * 天体贴图库
 * ═══════════════════════════════════════════════════════════
 *
 * ★ 为什么用贴图而不是程序化噪声：
 *   程序化生成的行星总带着「抽象画」的气质 —— 大陆像色块、
 *   海岸线不像海岸线。真实感的关键是**真实数据**。
 *   这里用的是 NASA 公开行星影像，等距圆柱投影，正好贴到球面。
 *
 * 贴图放在 public/textures/。
 * 想换天体：把新贴图放进那个目录，改下面的 TEXTURES 表即可。
 *
 * ⚠️ colorSpace 必须在贴图**加载完成后**设置：之前是 load() 之后
 *    立刻赋值 —— 此时纹理还没上传 GPU，设置会失效，结果贴图被当成
 *    线性数据渲染，颜色被冲淡成一片灰（海洋不再是蓝的）。
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import type { SceneBody } from '@/core/scene'

export const TEXTURES = {
  earth: {
    /** NASA 蓝色大理石（真实卫星影像，2048×1024 等距圆柱投影） */
    map: 'textures/earth-blue-marble.jpg',
    /** 法线：山脉与海底地形 */
    normalMap: 'textures/earth-normal.jpg',
    /** 高光：海洋白、陆地黑 */
    roughnessMap: 'textures/earth-specular.jpg',
    /** ★ 夜面城市灯光 —— 背光面能看到灯火，这是真实感的点睛之笔 */
    nightMap: 'textures/earth-night.jpg',
    /** 云层（叠加壳） */
    clouds: 'textures/earth-clouds.png',
  },
  moon: {
    map: 'textures/moon.jpg',
  },
} as const

/** 天体按类型取贴图；没有对应贴图的用程序化回退 */
export function useBodyTextures(body: SceneBody) {
  return useMemo(() => {
    const loader = new THREE.TextureLoader()
    /**
     * ★ colorSpace 必须在贴图**加载完成后**设置。
     * 之前是 load() 之后立刻赋值 —— 此时纹理还没上传 GPU，
     * 部分情况下设置不生效，结果贴图被当成线性数据渲染，
     * 颜色被冲淡成一片灰（海洋不再是蓝的）。
     */
    const load = (path: string, srgb = true) => {
      const t = loader.load(
        path,
        // ★ 加载完成后再设一次 colorSpace —— 确保 GPU 上传时用的是正确色彩空间
        (loaded) => {
          loaded.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
          loaded.anisotropy = 8
          loaded.needsUpdate = true
        },
      )
      // 立即设一次（走缓存的路径不会触发 onLoad 回调）
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
      t.anisotropy = 8
      return t
    }

    switch (body) {
      case 'planet': {
        const e = TEXTURES.earth
        return {
          map: load(e.map),
          normalMap: load(e.normalMap, false),
          roughnessMap: load(e.roughnessMap, false),
          emissiveMap: load(e.nightMap),
          cloudsMap: load(e.clouds),
        }
      }
      case 'moon':
        return { map: load(TEXTURES.moon.map) }
      default:
        return {}
    }
  }, [body])
}

/** 释放贴图，避免 GPU 显存泄漏 */
export function disposeTextures(maps: Record<string, THREE.Texture | undefined>) {
  for (const t of Object.values(maps)) t?.dispose()
}

