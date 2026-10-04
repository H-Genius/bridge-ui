/// <reference types="vite/client" />

/**
 * 自定义环境变量的类型声明
 * ═══════════════════════════════════════════════════════════
 * 在这里声明，代码里读 import.meta.env.VITE_XXX 才有类型提示。
 * 只有 VITE_ 前缀的变量会被 Vite 注入前端产物。
 */

interface ImportMetaEnv {
  /** 后端地址。不填 → AI 副官走本地 mock */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
