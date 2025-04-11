import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: [
            // UI libraries
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            // Add other UI libraries
          ]
        }
      }
    }
  }
})
