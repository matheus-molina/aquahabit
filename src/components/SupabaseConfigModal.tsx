import React, { useState } from 'react';
import { Database, Key, CheckCircle2, ShieldCheck, X, RefreshCw } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey, isConfigured, saveCustomSupabaseConfig, clearCustomSupabaseConfig } from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(supabaseUrl || '');
  const [anonKey, setAnonKey] = useState(supabaseAnonKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && anonKey) {
      saveCustomSupabaseConfig(url, anonKey);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    }
  };

  const handleClear = () => {
    if (confirm('Deseja redefinir para a configuração padrão?')) {
      clearCustomSupabaseConfig();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-850 border-t sm:border border-slate-700/80 rounded-t-[32px] sm:rounded-3xl p-5 sm:p-7 w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl safe-bottom animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-250 ease-out">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1 bg-slate-600/60 rounded-full mx-auto mb-3 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-750 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/15 rounded-2xl border border-emerald-500/30 text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Conexão Supabase</h3>
              <p className="text-[10px] text-slate-400 leading-tight">
                {isConfigured ? 'Status: Conectado e ativo' : 'Status: Modo Local / Offline'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-750 transition active:scale-95"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informação */}
        <div className="my-3 p-3 bg-slate-900/80 rounded-2xl border border-slate-750 text-[11px] text-slate-400 space-y-1 leading-relaxed">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Google OAuth & Nuvem</span>
          </div>
          <p>
            O app funciona 100% offline. Para sincronização e login, insira as credenciais do seu projeto Supabase.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 overflow-y-auto pr-0.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Database className="w-3 h-3 text-ocean-400" />
              Project URL
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full bg-slate-900 border border-slate-700 focus:border-ocean-400 text-white text-xs font-mono rounded-xl px-3 py-2.5 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-400" />
              Anon Public API Key
            </label>
            <input
              type="password"
              required
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsIn..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-ocean-400 text-white text-xs font-mono rounded-xl px-3 py-2.5 outline-none"
            />
          </div>

          {savedSuccess && (
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Configurações salvas com sucesso!
            </div>
          )}

          <div className="flex gap-2 pt-2 shrink-0">
            {isConfigured && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/50 transition active:scale-95"
              >
                Limpar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-750 border border-slate-700/60 transition active:scale-95"
            >
              Fechar
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-ocean-500 hover:bg-ocean-400 transition active:scale-95 shadow-md shadow-ocean-500/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Salvar & Conectar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
