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
        theme_color: '#D5205D', // A cor Magenta que vai colorir a barra de status do celular
        background_color: '#142239', // A cor de fundo da tela de carregamento do app
        display: 'standalone', // ISSO É A MÁGICA: Faz o app abrir em tela cheia, sem barra de URL
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Ajuda o ícone a se adaptar ao formato do celular (círculo, quadrado, etc)
          }
        ]
      }
    })
  ],
});