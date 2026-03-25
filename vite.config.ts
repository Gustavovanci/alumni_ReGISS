import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Garante que o SW será atualizado e caches antigos limpos automaticamente
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Alumni ReGISS',
        short_name: 'ReGISS',
        description: 'Rede de Gestão Integrada e Conexão em Saúde HCFMUSP',
        theme_color: '#D5205D',
        background_color: '#142239',
        display: 'standalone',
        // Garante que o app abre no feed, não na landing page
        start_url: '/feed',
        scope: '/',
        // Ícones com os nomes corretos dos arquivos em /public
        icons: [
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        // screenshots são obrigatórios pelo Chrome 116+ para Enhanced Install Experience
        screenshots: [
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Alumni ReGISS - Feed da Rede'
          }
        ]
      },
      workbox: {
        // Limpa automaticamente caches de versões antigas do SW — resolve o bug do desktop
        cleanupOutdatedCaches: true,
        // Navegação SPA: redireciona todas as rotas não-arquivo para o index.html
        navigateFallback: '/index.html',
        // Exclui rotas de API e Supabase do fallback de navegação
        navigateFallbackDenylist: [/^\/api\//, /supabase/, /\.ico$/, /\.png$/, /\.svg$/],
        // Chunks JS/CSS: StaleWhileRevalidate (usa cache mas já busca a versão nova)
        runtimeCaching: [
          {
            urlPattern: /\.(js|css|woff2?)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 dias
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 dias
            },
          },
        ],
      },
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