import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Dois destinos a partir do mesmo código:
 *
 *   vite build              → vai para dentro do APK
 *   vite build --mode web   → vai para o GitHub Pages, com PWA
 *
 * A separação não é organização, é correção. Se o service worker entrasse no
 * APK, o WebView do Android o registraria e passaria a servir arquivos em
 * cache de versões antigas depois de uma atualização — um app que "não
 * atualiza" sem erro nenhum aparente.
 */
export default defineConfig(({ mode }) => {
  const paraWeb = mode === 'web'

  return {
    plugins: [
      react(),
      ...(paraWeb
        ? [
            VitePWA({
              registerType: 'autoUpdate',
              // Sem o service worker o site precisaria de conexão só para
              // abrir, o que contradiz a promessa do app de funcionar
              // offline.
              workbox: {
                globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg}'],
                // As fontes empacotadas passam de 2 MB somadas.
                maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
                cleanupOutdatedCaches: true,
              },
              includeAssets: ['apple-touch-icon.png'],
              manifest: {
                name: 'Ponto',
                short_name: 'Ponto',
                description:
                  'Cronômetro de trabalho para freelancers, com relatório em PDF.',
                lang: 'pt-BR',
                start_url: './',
                scope: './',
                display: 'standalone',
                orientation: 'portrait',
                // Combina com o tema escuro (§5.1) para o navegador não
                // piscar branco antes da primeira tela.
                background_color: '#12110E',
                theme_color: '#12110E',
                categories: ['productivity', 'business'],
                icons: [
                  { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
                  { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
                  {
                    src: 'icone-512-maskable.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'maskable',
                  },
                ],
              },
            }),
          ]
        : []),
    ],

    // Caminhos relativos: o Capacitor serve de file:// e o GitHub Pages pode
    // servir de um subdiretório. Absoluto quebraria os dois.
    base: './',

    /*
      Os ícones do PWA moram em `public-web/` e só entram no build da web.
      O APK usa os ícones adaptáveis do Android e não tem o que fazer com
      manifesto, favicon ou apple-touch-icon.
    */
    publicDir: paraWeb ? 'public-web' : false,

    build: {
      outDir: paraWeb ? 'dist-web' : 'dist',
      assetsInlineLimit: 0,
      emptyOutDir: true,
    },

    server: {
      host: true,
      port: 5173,
    },
  }
})
