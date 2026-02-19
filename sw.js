const CACHE_NAME = 'sunny-bloom-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/kitchen.html',
    '/onboarding.html',
    '/tracker.html',
    '/wellness.html',
    '/auth.html',
    '/quran.html',
    '/js/app.js',
    '/js/prayer-times.js',
    '/js/auth.js',
    'https://cdn.jsdelivr.net/npm/adhan@4.4.1/Adhan.min.js',
    'https://cdn.tailwindcss.com?plugins=forms,container-queries',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});
