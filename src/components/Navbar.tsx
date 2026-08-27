import React from 'react';
import { 
  Droplets, 
  Flame, 
  Wifi, 
  WifiOff, 
  Database, 
  LogIn, 
  LogOut, 
  Scale
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWater } from '../contexts/WaterContext';
import { calculateStreak } from '../utils/healthCalculations';
import { getOfflineQueue } from '../utils/offlineQueue';

interface NavbarProps {
  onOpenOnboarding: () => void;
  onOpenSupabaseConfig: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenOnboarding, onOpenSupabaseConfig }) => {
  const { user, profile, isSupabaseActive, signInWithGoogle, signOut } = useAuth();
  const { isOnline, allLogs } = useWater();
  const streak = calculateStreak(allLogs);
  const offlineQueue = getOfflineQueue();

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-gradient-to-tr from-ocean-600 to-ocean-400 text-white shadow-md shadow-ocean-500/30">
            <Droplets className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              AquaHabit
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-ocean-500/20 text-ocean-300 border border-ocean-500/30">
                PWA
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Hidratação & IMC Diário</p>
          </div>
        </div>

        {/* Status Badges & Actions */}
        <div className="flex items-center gap-2">
          {/* Streak Badge */}
          {streak > 0 && (
            <div 
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold shadow-sm"
              title={`${streak} dias consecutivos de meta atingida!`}
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse-subtle" />
              <span>{streak}d</span>
            </div>
          )}

          {/* Network Status Badge */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold border transition ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
            title={isOnline ? 'Conectado à internet' : `Offline (${offlineQueue.length} na fila)`}
          >
            {isOnline ? (
              <Wifi className="w-3 h-3 text-emerald-400" />
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                {offlineQueue.length > 0 && <span>({offlineQueue.length})</span>}
              </>
            )}
          </div>

          {/* Botão de Perfil/IMC */}
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-semibold transition"
            title="Ajustar dados corporais e meta"
          >
            <Scale className="w-3.5 h-3.5 text-ocean-400" />
            <span className="hidden sm:inline">IMC:</span>
            <span className="font-bold text-ocean-300">{profile?.imc || 22.8}</span>
          </button>

          {/* Botão de Configuração Supabase */}
          <button
            type="button"
            onClick={onOpenSupabaseConfig}
            className={`p-2 rounded-xl border transition ${
              isSupabaseActive
                ? 'bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border-slate-700'
                : 'bg-slate-800/40 hover:bg-slate-700 text-slate-400 border-slate-800'
            }`}
            title="Configurar Supabase & Banco de Dados"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Login / Usuário */}
          {user ? (
            <div className="flex items-center gap-1.5">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'User'}
                  className="w-7 h-7 rounded-xl border border-ocean-500/50 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-xl bg-ocean-600 text-white flex items-center justify-center font-bold text-xs">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
              )}
              <button
                type="button"
                onClick={signOut}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-ocean-600 to-ocean-500 hover:from-ocean-500 hover:to-ocean-400 text-white rounded-xl text-xs font-bold shadow-sm transition"
              title="Entrar com Google"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
