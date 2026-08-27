import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, isConfigured } from '../lib/supabase';
import { UserProfile, DbProfileRow } from '../types';
import { calculateIMC, calculateDailyWaterTarget } from '../utils/healthCalculations';
import { getLocalProfile, saveLocalProfile } from '../utils/offlineQueue';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isGuest: boolean;
  isSupabaseActive: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  id: 'guest-user-id',
  full_name: 'Usuário Convidado',
  height_cm: 175,
  weight_kg: 70,
  gender: 'other',
  activity_level: 'moderate',
  imc: 22.86,
  imc_classification: 'Peso normal',
  daily_water_target_ml: 3000,
  reminder_interval_minutes: 90,
  reminder_enabled: true,
};

// Conversão DbProfileRow -> UserProfile
export function mapDbProfileToDomain(row: DbProfileRow): UserProfile {
  return {
    id: row.id_profile,
    email: row.nm_email,
    full_name: row.nm_full_name,
    avatar_url: row.dc_avatar_url,
    height_cm: Number(row.vl_height_cm) || 170,
    weight_kg: Number(row.vl_weight_kg) || 70,
    gender: row.dc_gender || 'other',
    activity_level: row.dc_activity_level || 'moderate',
    imc: Number(row.vl_imc) || 24.22,
    imc_classification: row.dc_imc_classification || 'Normal',
    daily_water_target_ml: row.qt_daily_water_target_ml || 2500,
    reminder_interval_minutes: row.qt_reminder_interval_min || 90,
    reminder_enabled: row.fl_reminder_enabled ?? true,
    created_at: row.dh_created_at,
    updated_at: row.dh_updated_at,
  };
}

// Conversão UserProfile -> DbProfileRow
export function mapDomainToDbProfile(profile: UserProfile): DbProfileRow {
  return {
    id_profile: profile.id,
    nm_email: profile.email,
    nm_full_name: profile.full_name,
    dc_avatar_url: profile.avatar_url,
    vl_height_cm: profile.height_cm,
    vl_weight_kg: profile.weight_kg,
    dc_gender: profile.gender,
    dc_activity_level: profile.activity_level,
    vl_imc: profile.imc,
    dc_imc_classification: profile.imc_classification,
    qt_daily_water_target_ml: profile.daily_water_target_ml,
    qt_reminder_interval_min: profile.reminder_interval_minutes,
    fl_reminder_enabled: profile.reminder_enabled,
    dh_updated_at: new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const supabase = getSupabaseClient();
  const isSupabaseActive = Boolean(supabase && isConfigured);

  // Carregar Perfil do Usuário
  const loadProfile = async (userId: string, email?: string, userMetadata?: any) => {
    if (!supabase) {
      const cached = getLocalProfile() || DEFAULT_PROFILE;
      setProfile(cached);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('t_profiles')
        .select('*')
        .eq('id_profile', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Erro ao carregar perfil do Supabase (t_profiles):', error);
      }

      if (data) {
        const domainProfile = mapDbProfileToDomain(data as DbProfileRow);
        setProfile(domainProfile);
        saveLocalProfile(domainProfile);
      } else {
        // Criar perfil padrão inicial
        const imcCalc = calculateIMC(70, 175);
        const waterCalc = calculateDailyWaterTarget(70, 'moderate');
        
        const newProfile: UserProfile = {
          id: userId,
          email: email || '',
          full_name: userMetadata?.full_name || userMetadata?.name || email?.split('@')[0] || 'Usuário',
          avatar_url: userMetadata?.avatar_url || userMetadata?.picture || '',
          height_cm: 175,
          weight_kg: 70,
          gender: 'other',
          activity_level: 'moderate',
          imc: imcCalc.imc,
          imc_classification: imcCalc.classification,
          daily_water_target_ml: waterCalc.targetMl,
          reminder_interval_minutes: 90,
          reminder_enabled: true,
        };

        const dbRow = mapDomainToDbProfile(newProfile);
        const { data: createdData } = await supabase
          .from('t_profiles')
          .insert(dbRow)
          .select()
          .single();

        const activeProfile = createdData ? mapDbProfileToDomain(createdData as DbProfileRow) : newProfile;
        setProfile(activeProfile);
        saveLocalProfile(activeProfile);
      }
    } catch (err) {
      console.error('Falha na inicialização do perfil:', err);
      const cached = getLocalProfile() || DEFAULT_PROFILE;
      setProfile(cached);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      if (!supabase) {
        // Modo Local / Convidado
        const localProf = getLocalProfile() || DEFAULT_PROFILE;
        setProfile(localProf);
        setIsGuest(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user || null);

        if (initialSession?.user) {
          setIsGuest(false);
          await loadProfile(
            initialSession.user.id,
            initialSession.user.email,
            initialSession.user.user_metadata
          );
        } else {
          const localProf = getLocalProfile() || DEFAULT_PROFILE;
          setProfile(localProf);
          setIsGuest(true);
        }
      } catch (e) {
        console.error('Erro ao verificar sessão:', e);
        const localProf = getLocalProfile() || DEFAULT_PROFILE;
        setProfile(localProf);
        setIsGuest(true);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        
        if (newSession?.user) {
          setIsGuest(false);
          await loadProfile(
            newSession.user.id,
            newSession.user.email,
            newSession.user.user_metadata
          );
        } else {
          setIsGuest(true);
        }
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [supabase]);

  const signInWithGoogle = async () => {
    if (!supabase) {
      alert('Por favor, configure a URL e a Anon Key do Supabase nas configurações.');
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Erro no login Google:', error.message);
      throw error;
    }
  };

  const signInAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    setSession(null);
    const localProf = getLocalProfile() || DEFAULT_PROFILE;
    setProfile(localProf);
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setIsGuest(true);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;

    const updated: UserProfile = {
      ...profile,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.weight_kg !== undefined || updates.height_cm !== undefined || updates.activity_level !== undefined) {
      const weight = updates.weight_kg ?? profile.weight_kg;
      const height = updates.height_cm ?? profile.height_cm;
      const activity = updates.activity_level ?? profile.activity_level;
      const gender = updates.gender ?? profile.gender;

      const imcResult = calculateIMC(weight, height);
      const waterResult = calculateDailyWaterTarget(weight, activity, gender, height);

      updated.imc = imcResult.imc;
      updated.imc_classification = imcResult.classification;
      if (!updates.daily_water_target_ml) {
        updated.daily_water_target_ml = waterResult.targetMl;
      }
    }

    setProfile(updated);
    saveLocalProfile(updated);

    if (supabase && user) {
      try {
        const dbRow = mapDomainToDbProfile(updated);
        const { error } = await supabase
          .from('t_profiles')
          .upsert(dbRow);
        
        if (error) {
          console.warn('Erro ao atualizar perfil no Supabase (t_profiles):', error);
        }
      } catch (err) {
        console.error('Erro na sincronização de perfil:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isGuest,
        isSupabaseActive,
        signInWithGoogle,
        signInAsGuest,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
