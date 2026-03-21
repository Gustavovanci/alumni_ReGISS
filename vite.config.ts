import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Alumni ReGISS',
        short_name: 'ReGISS',
        description: 'Rede de Gestão Integrada e Conexão em Saúde HCFMUSP',
        theme_color: '#D5205D',
        background_color: '#142239',
        display: 'standalone',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        // Separa as libs pesadas em chunks independentes que o browser cacheia
        manualChunks: {
          // React core — raramente muda, cache duradouro
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase — isolado para não re-baixar quando o app muda
          'vendor-supabase': ['@supabase/supabase-js'],
          // Framer Motion + Lucide — libs de UI pesadas
          'vendor-ui': ['framer-motion', 'lucide-react'],
          // Zustand + Sonner — estado e notificações
          'vendor-utils': ['zustand', 'sonner', 'clsx', 'tailwind-merge'],
        }
      }
    },
    // Aumenta o limite de warning de chunk (default 500kb é muito conservador para apps PWA)
    chunkSizeWarningLimit: 1000,
  }
});