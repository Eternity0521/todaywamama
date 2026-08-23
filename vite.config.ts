import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './'：产物使用相对路径，可部署到任意静态托管路径（Vercel / Netlify / GitHub Pages）
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'node',
    include: ['core/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.ts'],
  },
});
