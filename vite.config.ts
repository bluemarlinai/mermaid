import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 启用代码压缩
    minify: 'esbuild',
    // 配置代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 mermaid 相关代码单独打包
          mermaid: ['mermaid'],
          // 将 react 相关代码单独打包
          react: ['react', 'react-dom'],
        },
      },
    },
    // 生成 source map 用于调试
    sourcemap: false,
  },
  // 配置路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // 配置开发服务器
  server: {
    port: 5173,
  },
})
