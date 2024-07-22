self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
      fetch(event.request, { cache: 'no-store' })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification click:', event.notification);
  event.notification.close();
  event.waitUntil(
      clients.openWindow('/')
  );
});

self.addEventListener("push", async e => {
  try {
    if (e.data) {
      const data = JSON.parse(e.data.text());
      console.log(data);
      const clients = await self.clients.matchAll();
      console.log(clients)
      clients.forEach(client => {
        client.postMessage({
          type: 'push-notification',
          data: data
        });
      });
      //self.registration.showNotification("Wohoo!!", { body: data })
    } else {
      console.error("Push event but no data");
    }
  } catch (error) {
    console.error("Error parsing push data:", error);
  }
});

