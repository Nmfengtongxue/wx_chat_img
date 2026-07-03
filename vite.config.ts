import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 开发/Cursor 预览用 '/'，GitHub Pages 构建时设 VITE_BASE=/wx_chat_img/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
    open: false,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
})
