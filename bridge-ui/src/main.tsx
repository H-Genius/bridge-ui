/**
 * 应用入口
 * ═══════════════════════════════════════════════════════════
 * 只做三件事：导入全局样式、挂载 React、渲染根组件。
 * 业务逻辑一律不写在这里。
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './theme/globals.css'

const root = document.getElementById('root')
if (!root) throw new Error('找不到 #root 节点')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
