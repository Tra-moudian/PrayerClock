const CACHE="prayerclock-v4-7-push-test";
const APP_SHELL=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./suncalc-lite.js",
  "./adhan.mp3",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  event.respondWith(
    caches.match(event.request).then(cached=>{
      if(cached) return cached;
      return fetch(event.request).then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        return response;
      });
    })
  );
});


self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) ||
    "./index.html";

  event.waitUntil(
    clients.matchAll({type:"window", includeUncontrolled:true}).then(windowClients => {
      for(const client of windowClients){
        if("focus" in client){
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if(clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});


self.addEventListener("message", event => {
  const data = event.data || {};
  if(data.type === "SKIP_WAITING") { self.skipWaiting(); return; }
  if(data.type === "SHOW_TEST_NOTIFICATION") {
    const city = data.city || "PrayerClock";
    const nonce = data.nonce || Date.now();
    event.waitUntil(
      self.registration.showNotification("🕌 PrayerClock — test", {
        body: `Notification reçue correctement pour ${city}.`,
        icon: "./icon-192.png",
        badge: "./icon-192.png",
        tag: "prayerclock-test-" + nonce,
        vibrate: [200, 100, 200],
        data: { url: "./index.html" }
      }).then(() => {
        if(event.source) event.source.postMessage({type:"NOTIFICATION_SHOWN"});
      })
    );
  }
});


self.addEventListener("push", event => {
  let title = "🕌 PrayerClock";
  let body = "Notification reçue depuis le serveur PrayerClock.";
  let data = { url: "./index.html" };

  if(event.data){
    try{
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || body;
      data = payload.data || data;
    }catch(e){
      try{
        body = event.data.text() || body;
      }catch(_){}
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      tag: "prayerclock-server-push-" + Date.now(),
      vibrate: [200, 100, 200],
      data
    })
  );
});
