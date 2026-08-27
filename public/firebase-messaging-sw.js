// Firebase Messaging Service Worker para Push Notifications em Segundo Plano
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBMG9l9fDJbX6dB8eZCsk-iWp7j_upyhC0",
  authDomain: "aquahabit-web.firebaseapp.com",
  projectId: "aquahabit-web",
  storageBucket: "aquahabit-web.firebasestorage.app",
  messagingSenderId: "938286185511",
  appId: "1:938286185511:web:57257e336a6166cbf16202"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Interceptar notificações quando o app estiver fechado ou em segundo plano
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Notificação recebida em background:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'AquaHabit - Hidratação Diária';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Lembrete: Hora de beber um copo de água fresca! 💧',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/water-drop.svg',
    tag: 'hydration-reminder',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Ação de clique na notificação (abrir o AquaHabit)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
