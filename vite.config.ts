import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { copyFileSync, writeFileSync } from 'node:fs';

const release = process.env.GITHUB_SHA?.slice(0, 7) ?? 'local';

export default defineConfig({
  base: './',
  define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(release) },
  plugins: [react(), {
    name: 'release-entry',
    apply: 'build',
    closeBundle() {
      // 新入口讓仍持有舊首頁 HTML 的瀏覽器能取得這次建置的資產。
      copyFileSync('dist/index.html', 'dist/play.html');
      writeFileSync('dist/version.json', JSON.stringify({ release }));
    },
  }],
  build: { chunkSizeWarningLimit: 1600 },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
