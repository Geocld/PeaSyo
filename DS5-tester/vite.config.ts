import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue({
      script: {
        defineModel: true,
      },
    }),
    UnoCSS(),
    VueI18nPlugin({
      include: [path.resolve(__dirname, './src/locales/**.json')],
      strictMessage: false,
    }),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
