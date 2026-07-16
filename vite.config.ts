import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },

  build: {
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React core — dimuat pertama, paling kritis
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router-dom/') ||
              id.includes('/react-router/')
            ) {
              return 'vendor-core';
            }
            // Library QR — hanya untuk halaman security, isolasi supaya tidak polusi chunk lain
            if (id.includes('jsqr')) {
              return 'vendor-qr';
            }
            // Icon library — besar tapi tree-shakeable, pisahkan
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // MSW hanya untuk dev, pastikan tidak masuk production bundle
            if (id.includes('msw')) {
              return undefined; // biarkan tree-shaken
            }
            // Semua vendor lain (axios, zustand, dll)
            return 'vendor-helpers';
          }
        }
      }
    }
  },
});