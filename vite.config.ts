import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Multi-page: Tracewords at /, Cascade at /cascade/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        cascade: 'cascade/index.html',
      },
    },
  },
})
