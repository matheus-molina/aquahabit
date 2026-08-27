import { OfflineAction, WaterEntry, DailyLog, UserProfile } from '../types';

const OFFLINE_QUEUE_KEY = 'aquahabit_offline_queue_v1';
const LOCAL_ENTRIES_KEY = 'aquahabit_local_entries_v1';
const LOCAL_LOGS_KEY = 'aquahabit_local_logs_v1';
const LOCAL_PROFILE_KEY = 'aquahabit_local_profile_v1';

export function getOfflineQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Erro ao ler fila offline:', e);
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineAction[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Erro ao salvar fila offline:', e);
  }
}

export function enqueueOfflineAction(type: OfflineAction['type'], payload: any): void {
  const queue = getOfflineQueue();
  const action: OfflineAction = {
    id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    timestamp: Date.now(),
  };
  queue.push(action);
  saveOfflineQueue(queue);
}

// Persistência de cache local para leitura offline imediata
export function getLocalEntries(): WaterEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_ENTRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalEntries(entries: WaterEntry[]): void {
  try {
    localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Erro ao salvar entries locais:', e);
  }
}

export function getLocalLogs(): DailyLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalLogs(logs: DailyLog[]): void {
  try {
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Erro ao salvar logs locais:', e);
  }
}

export function getLocalProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Erro ao salvar perfil local:', e);
  }
}

/**
 * Processa a fila de ações offline quando a conexão com o Supabase estiver restabelecida
 */
export async function syncOfflineQueue(supabase: any): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine || !supabase) {
    return { synced: 0, failed: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remainingQueue: OfflineAction[] = [];

  for (const action of queue) {
    try {
      if (action.type === 'ADD_ENTRY') {
        const { error } = await supabase.from('t_water_entries').insert(action.payload);
        if (error) throw error;
      } else if (action.type === 'DELETE_ENTRY') {
        const { error } = await supabase.from('t_water_entries').delete().eq('id_water_entry', action.payload.id);
        if (error) throw error;
      } else if (action.type === 'UPDATE_DAILY_LOG') {
        const { error } = await supabase.from('t_daily_logs').upsert(action.payload, { onConflict: 'id_user,dt_log' });
        if (error) throw error;
      } else if (action.type === 'UPDATE_PROFILE') {
        const { error } = await supabase.from('t_profiles').upsert(action.payload);
        if (error) throw error;
      }
      synced++;
    } catch (err) {
      console.warn('Falha ao sincronizar item offline:', action, err);
      failed++;
      remainingQueue.push(action);
    }
  }

  saveOfflineQueue(remainingQueue);
  return { synced, failed };
}
