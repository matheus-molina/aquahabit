import React, { useState } from 'react';
import { 
  Droplets, 
  Flame, 
  WifiOff, 
  LogIn, 
  LogOut, 
  Scale,
  Settings,
  Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWater } from '../contexts/WaterContext';
import { calculateStreak } from '../utils/healthCalculations';
import { getOfflineQueue } from '../utils/offlineQueue';

interface NavbarProps {
  onOpenOnboarding: () => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenOnboarding, onOpenNotifications }) => {
  const { user, profile, signInWithGoogle, signOut } = useAuth();
  const { isOnline, allLogs } = useWater();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const streak = calculateStreak(allLogs);
  const offlineQueue = getOfflineQueue();

  const isNotificationsActive = Boolean(profile?.reminder_enabled && profile?.fcm_token);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 safe-top shadow-sm">
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-ocean-500 to-ocean-400 text-white shadow-md shadow-ocean-500/25 shrink-0">
            <Droplets className="w-4 h-4 fill-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1 leading-none truncate">
              AquaHabit
            </h1>
            <span className="text-[9px] text-slate-400 font-medium leading-none block mt-0.5">
              Diário de Hidratação
            </span>
          </div>
        </div>

        {/* Status Badges & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Streak Badge */}
          {streak > 0 && (
            <div 
              className="flex items-center gap-0.5 px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] font-bold"
              title={`${streak} dias consecutivos!`}
            >
              <Flame className="w-3 h-3 fill-amber-400 text-amber-400 animate-pulse-subtle" />
              <span>{streak}d</span>
            </div>
          )}

          {/* Offline Warning Pill */}
          {!isOnline && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
              title={`Modo Offline (${offlineQueue.length} na fila)`}
            >
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span>{offlineQueue.length > 0 ? `${offlineQueue.length}` : 'Off'}</span>
            </div>
          )}

          {/* Botão de Lembretes / Notificações */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className={`p-1.5 rounded-xl border transition active:scale-95 relative ${
              isNotificationsActive
                ? 'bg-slate-800 text-ocean-300 border-ocean-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-750'
            }`}
            title="Configurar Lembretes de Hidratação"
          >
            <Bell className="w-3.5 h-3.5" />
            {isNotificationsActive && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-ocean-400 rounded-full animate-pulse" />
            )}
          </button>

          {/* Botão de Perfil/IMC */}
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
            title="Ajustar dados corporais e IMC"
          >
            <Scale className="w-3 h-3 text-ocean-400" />
            <span className="text-ocean-300 text-[11px]">{profile?.imc || 22.8}</span>
          </button>

          {/* Usuário / Login Google */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center rounded-xl p-0.5 border border-ocean-500/40 active:scale-95 transition"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                    className="w-6 h-6 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-ocean-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </div>
                )}
              </button>

              {/* Menu Dropdown do Usuário */}
              {showUserMenu && (
                <div className="absolute right-0 top-9 w-48 bg-slate-850 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-2 border-b border-slate-750 mb-1">
                    <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'Usuário'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenNotifications();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-750 rounded-xl transition"
                  >
                    <Bell className="w-3.5 h-3.5 text-ocean-400" />
                    <span>Lembretes Diários</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenOnboarding();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-750 rounded-xl transition"
                  >
                    <Settings className="w-3.5 h-3.5 text-ocean-400" />
                    <span>Ajustar Perfil & IMC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-rose-400 hover:bg-rose-950/40 rounded-xl transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair da conta</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-ocean-500 to-ocean-400 hover:from-ocean-400 hover:to-ocean-300 text-white rounded-xl text-[11px] font-bold shadow-sm transition active:scale-95"
              title="Entrar com Google"
            >
              <LogIn className="w-3 h-3" />
              <span>Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
