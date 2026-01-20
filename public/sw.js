const CACHE_NAME = 'meusmangas-v1';
const IMAGE_CACHE_NAME = 'meusmangas-images-v1';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.png',
    '/index.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Cache strategy for images (MangaDex and others)
    if (event.request.destination === 'image' || url.hostname.includes('mangadex.org') || url.hostname.includes('uploads.mangadex.org')) {
        event.respondWith(
            caches.open(IMAGE_CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((response) => {
                    return response || fetch(event.request).then((fetchResponse) => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
        );
        return;
    }

    // Cache-first for local assets, network-first fallback for others
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                // Optional: return a fallback for navigation if offline
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
