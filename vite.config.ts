import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: ['buffer'],
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries into their own chunks
          'wharfkit-core': [
            '@wharfkit/session',
            '@wharfkit/antelope',
            '@wharfkit/web-renderer'
          ],
          'wharfkit-wallets': [
            '@wharfkit/wallet-plugin-anchor',
            '@wharfkit/wallet-plugin-cloudwallet',
            '@wharfkit/wallet-plugin-wombat',
            '@wharfkit/protocol-scatter'
          ],
          'neftyblocks': ['@neftyblocks/market'],
          'react-vendor': ['react', 'react-dom'],
          'utils': ['buffer']
        }
      }
    },
    // Increase chunk size warning limit since we're optimizing chunks
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging
    sourcemap: false,
    // Minify for production
    minify: 'terser'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@wharfkit/session',
      '@wharfkit/web-renderer'
    ]
  }
})
