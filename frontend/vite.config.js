import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Disponibiliza tokens e mixins em todos os blocos <style lang="scss">
        additionalData: `
          @use "@/assets/scss/variables" as *;
          @use "@/assets/scss/fonts" as *;
          @use "@/assets/scss/mixins" as *;
          @use "@/assets/scss/colors" as *;
        `,
        api: 'modern-compiler',
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
