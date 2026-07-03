import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages: https://nmfengtongxue.github.io/wx_chat_img/
export default defineConfig({
  base: '/wx_chat_img/',
  plugins: [react(), tailwindcss()],
})
