import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',  // Ou '/nome-do-repo/' se for em subpasta
  build: {
    outDir: '../../docs',  // ⭐ BUILD VAI PARA /docs
    emptyOutDir: true,
  }
})