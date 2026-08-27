import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: "AIzaSyBMG9l9fDJbX6dB8eZCsk-iWp7j_upyhC0",
  authDomain: "aquahabit-web.firebaseapp.com",
  projectId: "aquahabit-web",
  storageBucket: "aquahabit-web.firebasestorage.app",
  messagingSenderId: "938286185511",
  appId: "1:938286185511:web:57257e336a6166cbf16202"
};

export const VAPID_KEY = "BNG0dHnIYX5_EvQhLon0pi8brsYO784vNxqGJf0HepGcfAYjol9GEXq_G4cNQvMMrwy1G-caMqqz0RbEi5U_wqk";

// Inicialização Singleton do Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Solicita permissão de notificação ao usuário e retorna o Token FCM.
 */
export async function requestNotificationPermissionAndGetToken(): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Messaging não é suportado neste navegador/ambiente.');
      return null;
    }

    if (!('Notification' in window)) {
      console.warn('Este dispositivo não suporta notificações Web.');
      return null;
    }

    // Solicitar permissão nativa
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permissão de notificação negada ou dispensada pelo usuário.');
      return null;
    }

    // Registrar o Service Worker do Firebase
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      await navigator.serviceWorker.ready;
    }

    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });

    if (currentToken) {
      console.log('✅ FCM Token obtido com sucesso:', currentToken);
      return currentToken;
    } else {
      console.warn('Nenhum token FCM disponível.');
      return null;
    }
  } catch (error) {
    console.error('Erro ao obter token FCM de notificação:', error);
    return null;
  }
}

/**
 * Escuta notificações recebidas quando o app está aberto em primeiro plano (Foreground)
 */
export function setupForegroundMessageListener(onNotificationReceived: (payload: any) => void) {
  isSupported().then(supported => {
    if (!supported) return;
    try {
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        console.log('📩 Notificação recebida em primeiro plano:', payload);
        onNotificationReceived(payload);
      });
    } catch (e) {
      console.warn('Erro ao registrar listener de foreground:', e);
    }
  });
}
