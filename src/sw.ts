import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { createHandlerBoundToURL } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// 1. Otimizações de Cache do Vite
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

try {
    const handler = createHandlerBoundToURL('/index.html');
    const navigationRoute = new NavigationRoute(handler, {
        denylist: [/^\/api\//, /supabase/, /\.ico$/, /\.png$/, /\.svg$/],
    });
    registerRoute(navigationRoute);
} catch (error) {
    console.log('Falha no fallback navigation', error);
}

registerRoute(
    /\.(js|css|woff2?)$/,
    new StaleWhileRevalidate({
        cacheName: 'static-resources',
        plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 })],
    })
);

registerRoute(
    /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
    new CacheFirst({
        cacheName: 'images',
        plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 })],
    })
);

// 2. RECEBENDO O PUSH
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const payload = event.data.json();
    const title = payload.title || 'Alumni ReGISS';
    const options = {
        body: payload.body || 'Você tem uma nova notificação!',
        icon: '/web-app-manifest-192x192.png',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200], // Faz o celular vibrar
        data: { url: payload.url || '/feed' } // Para onde vai ao clicar
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// 3. AÇÃO AO CLICAR NA NOTIFICAÇÃO
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    const promiseChain = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        let matchingClient = null;
        for (let i = 0; i < windowClients.length; i++) {
            if (windowClients[i].url === urlToOpen) {
                matchingClient = windowClients[i];
                break;
            }
        }
        return matchingClient ? matchingClient.focus() : self.clients.openWindow(urlToOpen);
    });
    event.waitUntil(promiseChain);
});