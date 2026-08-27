import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Activity, User, Scale, ArrowRight, Droplets } from 'lucide-react';
import { UserProfile, Gender, ActivityLevel } from '../types';
import { calculateIMC, calculateDailyWaterTarget, formatWaterAmount } from '../utils/healthCalculations';

interface OnboardingModalProps {
  initialProfile: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialProfile,
  isOpen,
  onClose,
  onSave,
}) => {
  const [weightKg, setWeightKg] = useState<number>(initialProfile?.weight_kg || 70);
  const [heightCm, setHeightCm] = useState<number>(initialProfile?.height_cm || 175);
  const [gender] = useState<Gender>(initialProfile?.gender || 'other');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialProfile?.activity_level || 'moderate');
  const [customTarget, setCustomTarget] = useState<string>(
    initialProfile?.daily_water_target_ml ? String(initialProfile.daily_water_target_ml) : ''
  );
  const [isCustomizingTarget, setIsCustomizingTarget] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [hasEntered, setHasEntered] = useState<boolean>(false);

  // Estados para gesto de arrastar no topo com Pointer Capture e trava superior
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startYRef = useRef<number>(0);

  // Travar o scroll da tela de trás quando o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      setIsClosing(false);
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
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleSmoothClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setDragY(0);
      onClose();
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

  // Cálculos dinâmicos em tempo real
  const imcResult = calculateIMC(weightKg, heightCm);
  const waterTargetResult = calculateDailyWaterTarget(weightKg, activityLevel, gender, heightCm);
  const calculatedTarget = waterTargetResult.targetMl;
  const effectiveTarget = isCustomizingTarget && Number(customTarget) > 0 ? Number(customTarget) : calculatedTarget;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        weight_kg: weightKg,
        height_cm: heightCm,
        gender,
        activity_level: activityLevel,
        daily_water_target_ml: effectiveTarget,
        imc: imcResult.imc,
        imc_classification: imcResult.classification,
      });
      handleSmoothClose();
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={handleSmoothClose}
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm ${
        isClosing ? 'animate-backdrop-exit pointer-events-none' : 'animate-backdrop-enter'
      }`}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          transform: isClosing 
            ? undefined 
            : dragY > 0 
            ? `translateY(${dragY}px)` 
            : undefined,
          transition: isDragging ? 'none' : hasEntered ? 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)' : undefined,
        }}
        className={`bg-slate-850 border-t sm:border border-slate-700/80 rounded-t-[32px] sm:rounded-3xl p-5 sm:p-7 w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl safe-bottom ${
          isClosing ? 'animate-sheet-exit' : hasEntered ? '' : 'animate-sheet-enter'
        }`}
      >
        {/* Mobile Pull Handle Interativo com Pointer Capture & Trava Superior */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full py-3 -mt-3 mb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="w-14 h-1.5 bg-slate-600/80 hover:bg-slate-500 rounded-full transition-colors pointer-events-none" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-750 shrink-0">
          <div className="p-2 rounded-2xl bg-ocean-500/15 border border-ocean-500/30 text-ocean-400">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white leading-tight">
              Perfil Corporal & Meta
            </h2>
            <p className="text-[11px] text-slate-400 leading-tight">
              Cálculo de IMC e necessidade hídrica diária
            </p>
          </div>
        </div>

        {/* Conteúdo com Scroll Suave */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-3.5 pr-0.5">
          {/* Peso e Altura */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Scale className="w-3 h-3 text-ocean-400" />
                Peso (kg)
              </label>
              <input
                type="number"
                min="30"
                max="250"
                step="0.5"
                required
                value={weightKg}
                onChange={e => setWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-ocean-400 text-white font-extrabold text-lg rounded-2xl px-3.5 py-2.5 outline-none transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <User className="w-3 h-3 text-ocean-400" />
                Altura (cm)
              </label>
              <input
                type="number"
                min="100"
                max="240"
                step="1"
                required
                value={heightCm}
                onChange={e => setHeightCm(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-ocean-400 text-white font-extrabold text-lg rounded-2xl px-3.5 py-2.5 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Nível de Atividade Física */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Activity className="w-3 h-3 text-ocean-400" />
              Nível de Atividade Física
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'sedentary', label: 'Sedentário', sub: 'Pouco/nenhum', icon: '🛋️' },
                { id: 'moderate', label: 'Moderado', sub: '1-3x semana', icon: '🚶' },
                { id: 'intense', label: 'Intenso', sub: '4-7x / Atleta', icon: '🏃' },
              ].map(act => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setActivityLevel(act.id as ActivityLevel)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all active:scale-95 ${
                    activityLevel === act.id
                      ? 'bg-ocean-600/30 border-ocean-400 text-white shadow-md shadow-ocean-600/20'
                      : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="text-base mb-0.5">{act.icon}</span>
                  <span className="text-[11px] font-bold block leading-tight">{act.label}</span>
                  <span className="text-[9px] text-slate-400 block leading-tight mt-0.5">{act.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Dinâmico do IMC e da Meta */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-750 rounded-2xl space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-ocean-400" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  Cálculo Instantâneo
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border ${imcResult.color}`}>
                {imcResult.classification}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-slate-850 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[9px] text-slate-400 block font-medium">Seu IMC</span>
                <span className={`text-base font-black ${imcResult.color}`}>{imcResult.imc}</span>
              </div>

              <div className="p-2 bg-ocean-950/50 rounded-xl border border-ocean-800/60 text-center">
                <span className="text-[9px] text-ocean-300 block font-medium">Meta Diária Sugerida</span>
                <span className="text-base font-black text-white">{formatWaterAmount(effectiveTarget)}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight">
              💡 {waterTargetResult.recommendation}
            </p>
          </div>

          {/* Opção para Meta Manual Customizada */}
          <div>
            {!isCustomizingTarget ? (
              <button
                type="button"
                onClick={() => setIsCustomizingTarget(true)}
                className="text-[11px] text-ocean-400 hover:text-ocean-300 underline font-medium"
              >
                Prefiro definir uma meta personalizada em ml
              </button>
            ) : (
              <div className="space-y-1.5 p-3 bg-slate-800/80 border border-slate-700/70 rounded-2xl">
                <label className="text-[11px] font-bold text-slate-300">
                  Meta personalizada de água (ml):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1000"
                    max="6000"
                    step="50"
                    value={customTarget}
                    onChange={e => setCustomTarget(e.target.value)}
                    placeholder="Ex: 3200"
                    className="flex-1 bg-slate-900 border border-slate-700 text-white font-bold rounded-xl px-3 py-2 text-xs outline-none focus:border-ocean-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomizingTarget(false);
                      setCustomTarget('');
                    }}
                    className="px-3 py-2 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-750 rounded-xl transition"
                  >
                    Usar Sugerida
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ações / Botões Fixos no Rodapé do Modal */}
          <div className="flex gap-2.5 pt-2 shrink-0">
            <button
              type="button"
              onClick={handleSmoothClose}
              className="flex-1 py-3 px-3 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-750 border border-slate-700/60 transition active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || weightKg <= 0 || heightCm <= 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl text-xs font-bold text-white bg-ocean-500 hover:bg-ocean-400 active:scale-95 disabled:opacity-50 transition shadow-lg shadow-ocean-500/25"
            >
              {isSubmitting ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <span>Salvar Dados</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
