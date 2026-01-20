const CACHE_NAME = 'meusmangas-v2'; // Incrementado para forçar limpeza
const IMAGE_CACHE_NAME = 'meusmangas-images-v1';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.png',
    '/index.css'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Força o novo SW a assumir o controle imediatamente
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(), // Toma o controle das abas abertas imediatamente
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Ignorar completamente chamadas de API do MangaDex no SW
    // Deixamos o navegador lidar com isso para evitar problemas de CORS/Headers no proxy do SW
    if (url.hostname.includes('api.mangadex.org')) {
        return;
    }

    // 2. Cache APENAS para imagens do MangaDex
    if (event.request.destination === 'image' || url.hostname.includes('uploads.mangadex.org')) {
        event.respondWith(
            caches.open(IMAGE_CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((response) => {
                    return response || fetch(event.request).then((fetchResponse) => {
                        if (fetchResponse.ok) {
                            cache.put(event.request, fetchResponse.clone());
                        }
                        return fetchResponse;
                    }).catch(() => null);
                });
            })
        );
        return;
    }

    // 3. Estratégia para assets locais
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        }).catch(() => {
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
        })
    );
});
