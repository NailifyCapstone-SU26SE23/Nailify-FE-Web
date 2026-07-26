import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins:
    [react(),
    tailwindcss(),
    {
      name: 'strip-mediapipe-missing-sourcemap',
      load(id) {
        const normalizedId = id.replace(/\\/g, '/').split('?')[0]
        if (!normalizedId.endsWith('/@mediapipe/tasks-vision/vision_bundle.mjs')) {
          return null
        }

        return stripMissingMediaPipeSourceMap(readFileSync(normalizedId, 'utf8'))
      },
      transform(code, id) {
        const normalizedId = id.replace(/\\/g, '/').split('?')[0]
        if (!normalizedId.endsWith('/@mediapipe/tasks-vision/vision_bundle.mjs')) {
          return null
        }

        return {
          code: stripMissingMediaPipeSourceMap(code),
          map: null,
        }
      },
    }],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
  worker: {
    format: 'es',
  },
  build: {
    chunkSizeWarningLimit: 2500,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('@mediapipe') || id.includes('three') || id.includes('@react-three')) {
            return 'vendor-vision'
          }

          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('@reduxjs')) {
            return 'vendor-react'
          }

          if (id.includes('antd') || id.includes('@headlessui') || id.includes('lucide-react') || id.includes('framer-motion')) {
            return 'vendor-ui'
          }

          if (id.includes('recharts') || id.includes('fabric') || id.includes('html-to-image')) {
            return 'vendor-visualization'
          }

          return 'vendor'
        },
      },
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      // Allow cross-origin CDN images in isolated pages without breaking MediaPipe usage.
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      // Match dev-server behavior so preview can load external images consistently.
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
})

function stripMissingMediaPipeSourceMap(code) {
  return code.replace(/\n?\/\/# sourceMappingURL=vision_bundle_mjs\.js\.map\s*$/m, '')
}
