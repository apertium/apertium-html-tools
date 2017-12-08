self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('cache-1')
            .then(function(cache) {
                console.log('Opened cache')
                return cache.addAll([
                '/',
                '/index.html',
                '/?utm_source=homescreen'
                ]);
            })
    );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open('cache-1').then(function(cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});