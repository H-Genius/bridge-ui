import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // 用 @/ 指向 src/ —— 避免 ../../.. 这种相对路径地狱
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
