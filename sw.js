const CACHE_NAME = "gla-sys-v1";
self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(["./", "./index.html", "./style.css", "./script.js", "./manifest.json"]);
        })
    );
});
self.addEventListener("fetch", (e) => {
    e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});