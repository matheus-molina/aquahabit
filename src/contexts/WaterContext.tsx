import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { DailyLog, WaterEntry, BeverageType, DbDailyLogRow, DbWaterEntryRow } from '../types';
import { useAuth } from './AuthContext';
import { getSupabaseClient } from '../lib/supabase';
import { getLocalDateString } from '../utils/healthCalculations';
import {
  getLocalEntries,
  saveLocalEntries,
  getLocalLogs,
  saveLocalLogs,
  enqueueOfflineAction,
  syncOfflineQueue
} from '../utils/offlineQueue';
import {
  playWaterDropSound,
  playGoalCelebrationSound,
  triggerHaptic
} from '../utils/notifications';

interface WaterContextType {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  todayLog: DailyLog;
  currentDateLog: DailyLog;
  allLogs: DailyLog[];
  entries: WaterEntry[];
  isLoading: boolean;
  isOnline: boolean;
  addWaterEntry: (amountMl: number, beverageType?: BeverageType) => Promise<void>;
  deleteWaterEntry: (id: string) => Promise<void>;
  setCustomDailyTarget: (targetMl: number) => Promise<void>;
  refreshData: () => Promise<void>;
}

const WaterContext = createContext<WaterContextType | undefined>(undefined);

// Mappers Db <-> Domain
export function mapDbDailyLogToDomain(row: DbDailyLogRow): DailyLog {
  return {
    id: row.id_daily_log,
    user_id: row.id_user,
    date: row.dt_log,
    intake_ml: row.qt_intake_ml,
    target_ml: row.qt_target_ml,
    completed: row.fl_completed,
    created_at: row.dh_created_at,
    updated_at: row.dh_updated_at,
  };
}

export function mapDomainToDbDailyLog(log: DailyLog): DbDailyLogRow {
  return {
    id_daily_log: log.id.startsWith('log_') ? undefined as any : log.id,
    id_user: log.user_id,
    dt_log: log.date,
    qt_intake_ml: log.intake_ml,
    qt_target_ml: log.target_ml,
    fl_completed: log.completed,
    dh_updated_at: new Date().toISOString(),
  };
}

export function mapDbWaterEntryToDomain(row: DbWaterEntryRow): WaterEntry {
  return {
    id: row.id_water_entry,
    user_id: row.id_user,
    date: row.dt_entry,
    amount_ml: row.qt_amount_ml,
    beverage_type: row.dc_beverage_type,
    created_at: row.dh_created_at,
  };
}

export function mapDomainToDbWaterEntry(entry: WaterEntry): DbWaterEntryRow {
  return {
    id_water_entry: entry.id.startsWith('entry_') ? undefined as any : entry.id,
    id_user: entry.user_id,
    dt_entry: entry.date,
    qt_amount_ml: entry.amount_ml,
    dc_beverage_type: entry.beverage_type,
    dh_created_at: entry.created_at,
  };
}

export const WaterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString(new Date()));
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const supabase = getSupabaseClient();
  const userId = user?.id || 'guest-user-id';
  const defaultTarget = profile?.daily_water_target_ml || 2500;
  const todayStr = getLocalDateString(new Date());

  // Log do dia de hoje
  const todayLog: DailyLog = allLogs.find(l => l.date === todayStr) || {
    id: `log_${todayStr}`,
    user_id: userId,
    date: todayStr,
    intake_ml: 0,
    target_ml: defaultTarget,
    completed: false,
  };

  // Log da data selecionada na navegação
  const currentDateLog: DailyLog = allLogs.find(l => l.date === selectedDate) || {
    id: `log_${selectedDate}`,
    user_id: userId,
    date: selectedDate,
    intake_ml: 0,
    target_ml: defaultTarget,
    completed: false,
  };

  // Listener de status de rede Online/Offline
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      if (supabase) {
        await syncOfflineQueue(supabase);
        refreshData();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [supabase]);

  // Carregar dados (Logs e Entradas)
  const refreshData = useCallback(async () => {
    setIsLoading(true);

    if (!supabase || !user) {
      // Carregar dados locais (Modo Convidado / Offline)
      const localLogs = getLocalLogs();
      const localEntries = getLocalEntries();
      setAllLogs(localLogs);
      setEntries(localEntries.filter(e => e.date === selectedDate));
      setIsLoading(false);
      return;
    }

    try {
      // Buscar Daily Logs do Supabase
      const { data: logsData, error: logsError } = await supabase
        .from('t_daily_logs')
        .select('*')
        .eq('id_user', user.id);

      if (logsError) throw logsError;

      // Buscar Water Entries para a data selecionada
      const { data: entriesData, error: entriesError } = await supabase
        .from('t_water_entries')
        .select('*')
        .eq('id_user', user.id)
        .eq('dt_entry', selectedDate)
        .order('dh_created_at', { ascending: false });

      if (entriesError) throw entriesError;

      const loadedLogs = ((logsData as DbDailyLogRow[]) || []).map(mapDbDailyLogToDomain);
      const loadedEntries = ((entriesData as DbWaterEntryRow[]) || []).map(mapDbWaterEntryToDomain);

      setAllLogs(loadedLogs);
      setEntries(loadedEntries);
      saveLocalLogs(loadedLogs);
    } catch (err) {
      console.warn('Erro ao carregar dados do Supabase, usando cache local:', err);
      const localLogs = getLocalLogs();
      const localEntries = getLocalEntries();
      setAllLogs(localLogs);
      setEntries(localEntries.filter(e => e.date === selectedDate));
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user, selectedDate]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Adicionar registro de água
  const addWaterEntry = async (amountMl: number, beverageType: BeverageType = 'water') => {
    if (amountMl <= 0) return;

    playWaterDropSound();
    triggerHaptic('medium');

    const newEntryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newEntry: WaterEntry = {
      id: newEntryId,
      user_id: userId,
      date: selectedDate,
      amount_ml: amountMl,
      beverage_type: beverageType,
      created_at: new Date().toISOString(),
    };

    // Calcular novo intake
    const currentIntake = currentDateLog.intake_ml + amountMl;
    const isCompleted = currentIntake >= currentDateLog.target_ml;
    const wasCompletedBefore = currentDateLog.completed;

    const updatedLog: DailyLog = {
      ...currentDateLog,
      intake_ml: currentIntake,
      completed: isCompleted,
      updated_at: new Date().toISOString(),
    };

    // Atualização Otimista no Estado
    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);

    const updatedAllLogs = allLogs.some(l => l.date === selectedDate)
      ? allLogs.map(l => (l.date === selectedDate ? updatedLog : l))
      : [...allLogs, updatedLog];

    setAllLogs(updatedAllLogs);
    saveLocalEntries([...getLocalEntries(), newEntry]);
    saveLocalLogs(updatedAllLogs);

    // Celebração se acabou de bater a meta!
    if (isCompleted && !wasCompletedBefore) {
      playGoalCelebrationSound();
      triggerHaptic('success');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#0284c7', '#06b6d4', '#10b981', '#f59e0b'],
      });
    }

    // Persistir no Supabase ou Fila Offline
    const dbEntry = mapDomainToDbWaterEntry(newEntry);
    const dbLog = mapDomainToDbDailyLog(updatedLog);

    if (supabase && user && navigator.onLine) {
      try {
        const { error: entryErr } = await supabase.from('t_water_entries').insert(dbEntry);
        if (entryErr) throw entryErr;

        const { error: logErr } = await supabase.from('t_daily_logs').upsert(dbLog, { onConflict: 'id_user,dt_log' });
        if (logErr) throw logErr;
      } catch (err) {
        console.warn('Erro ao salvar no Supabase, adicionando à fila offline:', err);
        enqueueOfflineAction('ADD_ENTRY', dbEntry);
        enqueueOfflineAction('UPDATE_DAILY_LOG', dbLog);
      }
    } else {
      enqueueOfflineAction('ADD_ENTRY', dbEntry);
      enqueueOfflineAction('UPDATE_DAILY_LOG', dbLog);
    }
  };

  // Remover registro de água
  const deleteWaterEntry = async (id: string) => {
    const entryToDelete = entries.find(e => e.id === id);
    if (!entryToDelete) return;

    triggerHaptic('light');

    const newIntake = Math.max(0, currentDateLog.intake_ml - entryToDelete.amount_ml);
    const updatedLog: DailyLog = {
      ...currentDateLog,
      intake_ml: newIntake,
      completed: newIntake >= currentDateLog.target_ml,
      updated_at: new Date().toISOString(),
    };

    const updatedEntries = entries.filter(e => e.id !== id);
    setEntries(updatedEntries);

    const updatedAllLogs = allLogs.map(l => (l.date === selectedDate ? updatedLog : l));
    setAllLogs(updatedAllLogs);

    saveLocalEntries(getLocalEntries().filter(e => e.id !== id));
    saveLocalLogs(updatedAllLogs);

    const dbLog = mapDomainToDbDailyLog(updatedLog);

    if (supabase && user && navigator.onLine) {
      try {
        await supabase.from('t_water_entries').delete().eq('id_water_entry', id);
        await supabase.from('t_daily_logs').upsert(dbLog, { onConflict: 'id_user,dt_log' });
      } catch (err) {
        enqueueOfflineAction('DELETE_ENTRY', { id });
        enqueueOfflineAction('UPDATE_DAILY_LOG', dbLog);
      }
    } else {
      enqueueOfflineAction('DELETE_ENTRY', { id });
      enqueueOfflineAction('UPDATE_DAILY_LOG', dbLog);
    }
  };

  // Alterar meta personalizada do dia
  const setCustomDailyTarget = async (targetMl: number) => {
    const updatedLog: DailyLog = {
      ...currentDateLog,
      target_ml: targetMl,
      completed: currentDateLog.intake_ml >= targetMl,
      updated_at: new Date().toISOString(),
    };

    const updatedAllLogs = allLogs.some(l => l.date === selectedDate)
      ? allLogs.map(l => (l.date === selectedDate ? updatedLog : l))
      : [...allLogs, updatedLog];

    setAllLogs(updatedAllLogs);
    saveLocalLogs(updatedAllLogs);

    const dbLog = mapDomainToDbDailyLog(updatedLog);

    if (supabase && user && navigator.onLine) {
      try {
        await supabase.from('t_daily_logs').upsert(dbLog, { onConflict: 'id_user,dt_log' });
      } catch {
        enqueueOfflineAction('UPDATE_DAILY_LOG', dbLog);
      }
    }
  };

  return (
    <WaterContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        todayLog,
        currentDateLog,
        allLogs,
        entries,
        isLoading,
        isOnline,
        addWaterEntry,
        deleteWaterEntry,
        setCustomDailyTarget,
        refreshData,
      }}
    >
      {children}
    </WaterContext.Provider>
  );
};

export const useWater = () => {
  const context = useContext(WaterContext);
  if (!context) {
    throw new Error('useWater deve ser utilizado dentro de um WaterProvider');
  }
  return context;
};
