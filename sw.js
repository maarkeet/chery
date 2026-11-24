const CACHE_NAME = 'cherie-mommy-shell-v6';
const APP_URL = new URL('./index.html', self.registration.scope).href;
const APP_SHELL = [
    APP_URL,
    new URL('./style.css?v=mobile-v3', self.registration.scope).href,
    new URL('./data.js', self.registration.scope).href,
    new URL('./storefront-loader.js', self.registration.scope).href,
    new URL('./script.js', self.registration.scope).href,
    new URL('./manifest.webmanifest', self.registration.scope).href,
    new URL('./supabase-config.js', self.registration.scope).href,
    new URL('./app-icon-192.png', self.registration.scope).href,
    new URL('./app-icon-512.png', self.registration.scope).href,
    new URL('./cherie-mommy-logo.jpg', self.registration.scope).href
];
const CACHEABLE_EXTERNAL_ORIGINS = new Set([
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
]);
const EXTERNAL_APP_SHELL = [
    new Request('https://cdn.tailwindcss.com', { mode: 'no-cors' }),
    new Request('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', { mode: 'no-cors' })
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                await cache.addAll(APP_SHELL);
                await Promise.all(EXTERNAL_APP_SHELL.map(async request => {
                    try {
                        const response = await fetch(request);
                        if (response.ok || response.type === 'opaque') {
                            await cache.put(request, response);
                        }
                    } catch (error) {
                        console.warn('Could not precache an optional app dependency', request.url, error);
                    }
                }));
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key.startsWith('cherie-mommy-shell-') && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const requestUrl = new URL(request.url);
    if (request.method !== 'GET') return;

    if (requestUrl.origin !== self.location.origin) {
        if (!CACHEABLE_EXTERNAL_ORIGINS.has(requestUrl.origin)) return;
        event.respondWith(
            caches.match(request).then(cached => fetch(request).then(response => {
                if (response.ok || response.type === 'opaque') {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                }
                return response;
            }).catch(error => {
                if (cached) return cached;
                throw error;
            }))
        );
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(async () => (await caches.match(request)) || caches.match(APP_URL))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then(cached => cached || fetch(request).then(response => {
            if (response.ok) {
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
            }
            return response;
        }))
    );
});
