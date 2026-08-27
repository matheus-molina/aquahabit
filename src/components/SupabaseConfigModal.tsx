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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Conexão Supabase</h3>
              <p className="text-xs text-slate-400">
                {isConfigured ? 'Status: Conectado e ativo' : 'Status: Modo Local / Offline'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informação */}
        <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Google OAuth & Persistência na Nuvem</span>
          </div>
          <p>
            O app funciona 100% offline em modo local. Para sincronizar em múltiplos dispositivos e fazer login com o Google, insira os dados do seu projeto Supabase abaixo.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-ocean-400" />
              Project URL
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full bg-slate-800 border border-slate-700 focus:border-ocean-500 text-white text-xs font-mono rounded-xl px-3 py-2.5 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Anon Public API Key
            </label>
            <input
              type="password"
              required
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsIn..."
              className="w-full bg-slate-800 border border-slate-700 focus:border-ocean-500 text-white text-xs font-mono rounded-xl px-3 py-2.5 outline-none"
            />
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Configurações salvas! Recarregando conexão...
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {isConfigured && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/50 transition"
              >
                Limpar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
            >
              Fechar
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-ocean-600 hover:bg-ocean-500 transition shadow-md shadow-ocean-600/30"
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
