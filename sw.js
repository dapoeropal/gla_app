// UBAH NAMA CACHE MENJADI V2 AGAR SISTEM TAHU INI VERSI BARU
const CACHE_NAME = "gla-sys-v4"; 

self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(["./", "./index.html", "./style.css", "./script.js", "./manifest.json"]);
        })
    );
});

// EVENT ACTIVATE: Menghapus ingatan (Cache) file yang lama
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});

self.addEventListener("fetch", (e) => {
    e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});
