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
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
  worker: {
    format: 'es',
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
