import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  server: { host: true, allowedHosts: true },
  base: "./",
  build: { cssMinify: !process.env.TERMUX_VERSION },
  plugins: [react()],
})
