import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // 🔥 เปิดให้ทุกเครื่องเข้าได้
    port: 5173
  }
})