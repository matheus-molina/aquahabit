/**
 * Módulo de Notificações, Lembretes e Feedback Háptico/Sonoro
 */

/**
 * Toca um efeito sonoro sintetizado via Web Audio API (som de gota d'água / chime cristalino)
 */
export function playWaterDropSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Frequência modulando rapidamente de 600Hz para 1400Hz (efeito gota de água "plop")
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Silêncio se não suportado ou bloqueado por política de autoplay
  }
}

/**
 * Toca acorde de celebração quando atinge 100% da meta
 */
export function playGoalCelebrationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Acorde Maior)

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + index * 0.08);
      osc.stop(ctx.currentTime + index * 0.08 + 0.5);
    });
  } catch {
    // Silêncio
  }
}

/**
 * Vibração háptica para dispositivos móveis
 */
export function triggerHaptic(type: 'light' | 'medium' | 'success' = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    if (type === 'light') {
      navigator.vibrate(15);
    } else if (type === 'medium') {
      navigator.vibrate([20, 30, 20]);
    } else if (type === 'success') {
      navigator.vibrate([30, 50, 40, 50, 60]);
    }
  }
}

/**
 * Solicita permissão para notificações do navegador
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Dispara notificação local de lembrete de hidratação
 */
export function sendHydrationNotification(title = 'Hora de beber água! 💧', body = 'Mantenha seu corpo hidratado para atingir sua meta diária.'): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: '/icons/water-drop.svg',
      badge: '/icons/water-drop.svg',
      tag: 'aquahabit-reminder',
    });
    playWaterDropSound();
  } catch (err) {
    console.warn('Erro ao disparar notificação:', err);
  }
}
