const CACHE="prayerclock-v5-0-1-update-test";
const META_CACHE="prayerclock-meta";
const PUSH_SERVER="https://prayerclock-notifications.tramoudian1963.workers.dev";
const APP_SHELL=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./suncalc-lite.js",
  "./cities.js",
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
      keys.filter(key=>key!==CACHE && key!==META_CACHE).map(key=>caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;

  const url = new URL(event.request.url);

  // Le fichier de version ne doit jamais rester bloqué dans le cache.
  if(url.pathname.endsWith("/version.json")){
    event.respondWith(
      fetch(event.request, {cache:"no-store"})
    );
    return;
  }

  // La liste des villes se met à jour facilement sans perdre
  // la dernière copie disponible hors connexion.
  if(url.pathname.endsWith("/cities.js")){
    event.respondWith(
      fetch(event.request, {cache:"no-store"})
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
          return response;
        })
        .catch(()=>caches.match(event.request))
    );
    return;
  }

  // Le reste de l'application reste disponible hors ligne.
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



function pushContextRequest(){
  return new Request(
    new URL("./__push_context__", self.registration.scope).href
  );
}

async function savePushContext(data){
  const cache = await caches.open(META_CACHE);

  await cache.put(
    pushContextRequest(),
    new Response(
      JSON.stringify(data),
      {headers: {"Content-Type":"application/json"}}
    )
  );
}

async function loadPushContext(){
  try{
    const cache = await caches.open(META_CACHE);
    const response = await cache.match(pushContextRequest());

    if(!response) return null;
    return await response.json();
  }catch(e){
    return null;
  }
}

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

  if(data.type === "SKIP_WAITING"){
    self.skipWaiting();
    return;
  }

  if(data.type === "SAVE_PUSH_CONTEXT"){
    event.waitUntil(
      savePushContext({
        subscriberId: data.subscriberId || null
      })
    );
    return;
  }

});


self.addEventListener("push", event => {
  event.waitUntil((async()=>{
    let title = "🕌 PrayerClock";
    let body = "C’est l’heure de la prière.";
    let data = { url: "./index.html" };

    // Un éventuel payload reste prioritaire.
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
    }else{
      // Les pushes PrayerClock sont volontairement sans payload chiffré.
      // Le service worker récupère le nom de la prière auprès du Worker.
      const context = await loadPushContext();

      if(context && context.subscriberId){
        try{
          const response = await fetch(
            PUSH_SERVER +
            "/notification-info?subscriberId=" +
            encodeURIComponent(context.subscriberId),
            {cache:"no-store"}
          );

          if(response.ok){
            const info = await response.json();

            if(info.ok && info.prayer){
              title = `🕌 ${info.prayer}${info.time ? " — " + info.time : ""}`;
              body = info.city
                ? `C’est l’heure de la prière à ${info.city}.`
                : "C’est l’heure de la prière.";
            }
          }
        }catch(e){
          // Le push reste visible avec le texte générique.
        }
      }
    }

    await self.registration.showNotification(title, {
      body,
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      tag: "prayerclock-server-push-" + Date.now(),
      vibrate: [200, 100, 200],
      data
    });
  })());
});
