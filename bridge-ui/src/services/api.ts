/**
 * HTTP 请求骨架 —— 全项目唯一的网络出口
 * ═══════════════════════════════════════════════════════════
 *
 * ★ 为什么要有这一层：
 *   业务代码只关心「问什么、答什么」，不该关心 baseURL、超时、重试、
 *   错误格式。这些东西集中在这里，以后换后端（自建 / 第三方 / 本地
 *   中转）只改这一个文件，上层一行不动。
 *
 * ★ 现在项目里还没有任何真实请求 —— 这个文件是**预留骨架**。
 *   想接通后端时：
 *     1. 复制 .env.example 为 .env.local，填 VITE_API_BASE_URL
 *     2. 在 services/ 下按接口写具体函数（参考 ai.ts 的写法）
 *     3. 把调用处的 mock 换成真实调用
 *
 * ⚠️ 安全约定：前端代码是公开的，**任何密钥都不能写在这里**。
 *    需要密钥的请求应该走你自己的后端中转，前端只调自己的接口。
 */

/** 从环境变量读后端地址。没配就当没后端（走本地 mock） */
const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''

/** 默认超时（毫秒） */
const DEFAULT_TIMEOUT = 20_000

/** 是否配置了后端 —— 上层据此决定走真实请求还是 mock */
export const hasBackend = BASE_URL.length > 0

/** 统一的错误类型，让上层能分辨「网络问题」和「业务拒绝」 */
export class ApiError extends Error {
  readonly status?: number
  readonly body?: unknown

  constructor(message: string, status?: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** 请求体，会自动 JSON 序列化 */
  body?: unknown
  /** 附加请求头 */
  headers?: Record<string, string>
  /** 覆盖默认超时 */
  timeout?: number
  /** 外部取消信号（比如组件卸载） */
  signal?: AbortSignal
}

/**
 * 发起一次请求。
 *
 * - 自动加 JSON 头、序列化 body
 * - 超时即中止，抛 ApiError
 * - 非 2xx 抛 ApiError（带 status 和响应体，方便排查）
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, timeout = DEFAULT_TIMEOUT, signal } = options

  if (!hasBackend) {
    throw new ApiError('未配置后端地址（VITE_API_BASE_URL）')
  }

  // 超时与外部取消合并：任一触发都中止
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(new Error('timeout')), timeout)
  const onAbort = () => ctrl.abort(signal?.reason)
  signal?.addEventListener('abort', onAbort, { once: true })

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      signal: ctrl.signal,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    // 204 之类没有响应体
    const text = await res.text()
    const data = text ? safeJson(text) : null

    if (!res.ok) {
      throw new ApiError(
        `请求失败 ${res.status} ${res.statusText}`,
        res.status,
        data,
      )
    }
    return data as T
  } catch (err) {
    if (err instanceof ApiError) throw err
    if ((err as Error)?.name === 'AbortError') {
      throw new ApiError('请求已取消或超时')
    }
    throw new ApiError(`网络错误：${(err as Error)?.message ?? '未知'}`)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/** 解析失败时不要把整个请求搞崩，原样返回文本 */
function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/* ─────────── 便捷方法 ─────────── */

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
