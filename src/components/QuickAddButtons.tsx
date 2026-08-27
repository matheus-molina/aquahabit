import React, { useState } from 'react';
import { Plus, Coffee, GlassWater, Sparkles, Citrus } from 'lucide-react';
import { BeverageType } from '../types';

interface QuickAddButtonsProps {
  onAdd: (amountMl: number, beverageType: BeverageType) => void;
  isLoading?: boolean;
}

const PRESET_AMOUNTS = [
  { amount: 150, label: '150 ml', icon: '☕', name: 'Xícara / Copinho' },
  { amount: 250, label: '250 ml', icon: '🥛', name: 'Copo Padrão' },
  { amount: 500, label: '500 ml', icon: '🍶', name: 'Garrafinha' },
  { amount: 750, label: '750 ml', icon: '🧴', name: 'Squeeze' },
];

const BEVERAGES: { type: BeverageType; name: string; icon: any; color: string }[] = [
  { type: 'water', name: 'Água Pura', icon: GlassWater, color: 'text-ocean-400 border-ocean-500/30' },
  { type: 'lemon_water', name: 'Água c/ Limão', icon: Citrus, color: 'text-lime-400 border-lime-500/30' },
  { type: 'tea', name: 'Chá Natural', icon: Coffee, color: 'text-emerald-400 border-emerald-500/30' },
  { type: 'sports', name: 'Isotônico', icon: Sparkles, color: 'text-cyan-400 border-cyan-500/30' },
];

export const QuickAddButtons: React.FC<QuickAddButtonsProps> = ({ onAdd, isLoading = false }) => {
  const [selectedBeverage, setSelectedBeverage] = useState<BeverageType>('water');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(customAmount, 10);
    if (!isNaN(amount) && amount > 0) {
      onAdd(amount, selectedBeverage);
      setCustomAmount('');
      setShowCustomModal(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Seletor de Tipo de Bebida */}
      <div className="flex items-center justify-between gap-1.5 p-1 bg-slate-900/80 backdrop-blur rounded-2xl border border-slate-800">
        {BEVERAGES.map(bev => {
          const isSelected = selectedBeverage === bev.type;
          const Icon = bev.icon;
          return (
            <button
              key={bev.type}
              type="button"
              onClick={() => setSelectedBeverage(bev.type)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isSelected
                  ? 'bg-ocean-600/30 text-ocean-300 border border-ocean-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{bev.name}</span>
              <span className="sm:hidden">{bev.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Botões Rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {PRESET_AMOUNTS.map(preset => (
          <button
            key={preset.amount}
            type="button"
            disabled={isLoading}
            onClick={() => onAdd(preset.amount, selectedBeverage)}
            className="group relative flex flex-col items-center justify-center p-3.5 bg-gradient-to-b from-slate-800/80 to-slate-900/90 hover:from-slate-750 hover:to-slate-850 active:scale-95 border border-slate-700/60 hover:border-ocean-500/50 rounded-2xl transition-all duration-200 shadow-md hover:shadow-ocean-950/40"
          >
            <span className="text-xl mb-1 transition-transform group-hover:scale-110">
              {preset.icon}
            </span>
            <span className="text-base font-bold text-white group-hover:text-ocean-300 transition-colors">
              +{preset.label}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {preset.name}
            </span>
          </button>
        ))}
      </div>

      {/* Botão de Adição Customizada */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowCustomModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-ocean-300 bg-ocean-950/60 hover:bg-ocean-900/60 border border-ocean-800/60 hover:border-ocean-600/60 rounded-full transition-all duration-200 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Registrar quantidade personalizada
        </button>
      </div>

      {/* Modal Customizado */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Quantidade Personalizada</h3>
            <p className="text-xs text-slate-400 mb-4">Digite o volume em mililitros (ml) que você ingeriu.</p>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="number"
                  autoFocus
                  min="10"
                  max="3000"
                  step="10"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  placeholder="Ex: 350"
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 text-white text-xl font-bold rounded-2xl px-4 py-3 outline-none transition-all placeholder:text-slate-500"
                />
                <span className="absolute right-4 top-3.5 text-sm font-semibold text-slate-400">ml</span>
              </div>

              {/* Botões prévios rápidos */}
              <div className="flex gap-2">
                {[200, 350, 600, 1000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomAmount(String(amt))}
                    className="flex-1 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                  >
                    {amt}ml
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!customAmount || parseInt(customAmount, 10) <= 0}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-ocean-600 hover:bg-ocean-500 active:scale-95 disabled:opacity-50 transition shadow-lg shadow-ocean-600/30"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
