import React, { useState, useEffect, useRef } from 'react';
import { Plus, GlassWater } from 'lucide-react';
import { BeverageType } from '../types';

interface QuickAddButtonsProps {
  onAdd: (amountMl: number, beverageType?: BeverageType) => void;
  isLoading?: boolean;
}

const PRESET_AMOUNTS = [
  { amount: 150, label: '150 ml', icon: '☕', name: 'Xícara' },
  { amount: 250, label: '250 ml', icon: '🥛', name: 'Copo' },
  { amount: 500, label: '500 ml', icon: '🍶', name: 'Garrafinha' },
  { amount: 750, label: '750 ml', icon: '🧴', name: 'Squeeze' },
];

export const QuickAddButtons: React.FC<QuickAddButtonsProps> = ({ onAdd, isLoading = false }) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');

  // Drag-to-dismiss com Pointer Capture e trava superior
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startYRef = useRef<number>(0);

  useEffect(() => {
    if (showCustomModal) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      setIsClosingModal(false);
      setDragY(0);
      setIsDragging(false);
      const timer = setTimeout(() => setHasEntered(true), 320);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      setHasEntered(false);
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showCustomModal]);

  const handleOpenModal = () => {
    setIsClosingModal(false);
    setDragY(0);
    setShowCustomModal(true);
  };

  const handleSmoothClose = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setIsClosingModal(false);
      setDragY(0);
      setShowCustomModal(false);
    }, 220);
  };

  // Pointer Events para captura contínua e 100% responsiva ao dedo
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    startYRef.current = e.clientY;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startYRef.current;
    // Trava de limite superior: não permite subir acima do topo do modal (>= 0)
    setDragY(Math.max(0, deltaY));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(false);
    if (dragY > 75) {
      handleSmoothClose();
    } else {
      setDragY(0);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(customAmount, 10);
    if (!isNaN(amount) && amount > 0) {
      onAdd(amount, 'water');
      setCustomAmount('');
      handleSmoothClose();
    }
  };

  return (
    <div className="w-full space-y-2.5">
      {/* Botões Rápidos por Tamanho do Recipiente (2x2) */}
      <div className="grid grid-cols-2 gap-2.5">
        {PRESET_AMOUNTS.map(preset => (
          <button
            key={preset.amount}
            type="button"
            disabled={isLoading}
            onClick={() => onAdd(preset.amount, 'water')}
            className="group relative flex flex-col items-center justify-center p-3.5 bg-slate-850/80 hover:bg-slate-750 active:scale-95 border border-slate-700/70 hover:border-ocean-400/50 rounded-2xl transition-all shadow-sm"
          >
            <span className="text-2xl mb-1 transition-transform group-hover:scale-110">
              {preset.icon}
            </span>
            <span className="text-base font-extrabold text-white group-hover:text-ocean-300 transition-colors">
              +{preset.label}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {preset.name}
            </span>
          </button>
        ))}
      </div>

      {/* Botão de Adição Customizada */}
      <div className="flex justify-center pt-0.5">
        <button
          type="button"
          onClick={handleOpenModal}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-ocean-300 bg-ocean-950/30 hover:bg-ocean-900/40 border border-ocean-700/40 rounded-2xl transition active:scale-98 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Registrar quantidade personalizada
        </button>
      </div>

      {/* Modal Customizado (BottomSheet com Abertura/Fechamento Suaves e Drag Gesture) */}
      {showCustomModal && (
        <div
          onClick={handleSmoothClose}
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm ${
            isClosingModal ? 'animate-backdrop-exit pointer-events-none' : 'animate-backdrop-enter'
          }`}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              transform: isClosingModal 
                ? undefined 
                : dragY > 0 
                ? `translateY(${dragY}px)` 
                : undefined,
              transition: isDragging ? 'none' : hasEntered ? 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)' : undefined,
            }}
            className={`bg-slate-850 border-t sm:border border-slate-700 rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4 safe-bottom ${
              isClosingModal ? 'animate-sheet-exit' : hasEntered ? '' : 'animate-sheet-enter'
            }`}
          >
            {/* Mobile Drag Handle Interativo com Pointer Capture & Trava Superior */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full py-3 -mt-3 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none"
            >
              <div className="w-14 h-1.5 bg-slate-600/80 hover:bg-slate-500 rounded-full transition-colors pointer-events-none" />
            </div>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-750">
              <div className="p-2 rounded-xl bg-ocean-500/15 text-ocean-400 border border-ocean-500/30">
                <GlassWater className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">Adicionar Água</h3>
                <p className="text-[11px] text-slate-400 leading-tight">Digite o volume em mililitros (ml)</p>
              </div>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-3.5">
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
                  className="w-full bg-slate-900 border border-slate-700 focus:border-ocean-400 text-white text-lg font-extrabold rounded-2xl px-4 py-3 outline-none placeholder:text-slate-500 shadow-inner"
                />
                <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">ml</span>
              </div>

              {/* Presets Rápidos dentro do Modal */}
              <div className="grid grid-cols-4 gap-1.5">
                {[200, 350, 600, 1000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomAmount(String(amt))}
                    className="py-2 text-[11px] font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl transition active:scale-95 border border-slate-700/60"
                  >
                    {amt}ml
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSmoothClose}
                  className="flex-1 py-3 px-3 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-750 border border-slate-700/60 transition active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!customAmount || parseInt(customAmount, 10) <= 0}
                  className="flex-1 py-3 px-3 rounded-2xl text-xs font-bold text-white bg-ocean-500 hover:bg-ocean-400 active:scale-95 disabled:opacity-50 transition shadow-md shadow-ocean-500/30"
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
