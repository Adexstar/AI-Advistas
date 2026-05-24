import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');

          if (!normalizedId.includes('/node_modules/')) {
            return undefined;
          }

          if (
            normalizedId.includes('/react/') ||
            normalizedId.includes('/react-dom/') ||
            normalizedId.includes('/react-router/') ||
            normalizedId.includes('/react-router-dom/') ||
            normalizedId.includes('/scheduler/')
          ) {
            return 'vendor-react';
          }

          if (
            normalizedId.includes('/@tanstack/react-query/') ||
            normalizedId.includes('/@supabase/')
          ) {
            return 'vendor-data';
          }

          if (
            normalizedId.includes('/@radix-ui/') ||
            normalizedId.includes('/lucide-react/') ||
            normalizedId.includes('/framer-motion/') ||
            normalizedId.includes('/embla-carousel-react/') ||
            normalizedId.includes('/sonner/')
          ) {
            return 'vendor-ui';
          }

          if (
            normalizedId.includes('/fabric/') ||
            normalizedId.includes('/ag-psd/') ||
            normalizedId.includes('/react-grid-layout/') ||
            normalizedId.includes('/react-resizable-panels/') ||
            normalizedId.includes('/react-resizable/') ||
            normalizedId.includes('/recharts/') ||
            normalizedId.includes('/react-player/') ||
            normalizedId.includes('/wavesurfer.js/')
          ) {
            return 'vendor-editor';
          }

          if (
            normalizedId.includes('/react-hook-form/') ||
            normalizedId.includes('/@hookform/resolvers/') ||
            normalizedId.includes('/zod/') ||
            normalizedId.includes('/cmdk/') ||
            normalizedId.includes('/input-otp/') ||
            normalizedId.includes('/date-fns/')
          ) {
            return 'vendor-forms';
          }

          if (normalizedId.includes('/html2canvas/')) {
            return 'vendor-html2canvas';
          }

          if (normalizedId.includes('/jspdf/')) {
            return 'vendor-jspdf';
          }

          return 'vendor';
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
