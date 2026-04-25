importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config (environment variables service worker da ishlamaydi — hardcode qilish kerak)
// Bu qiymatlar firebase.ts dagi bilan mos bo'lishi kerak
const firebaseConfig = self.__FIREBASE_CONFIG__ || {};

if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification || {};
    if (!title) return;
    self.registration.showNotification(title, {
      body:  body || '',
      icon:  '/favicon.svg',
      badge: '/favicon.svg',
      data:  payload.data || {},
      vibrate: [200, 100, 200],
    });
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/dashboard';
    event.waitUntil(clients.openWindow(url));
  });
}
