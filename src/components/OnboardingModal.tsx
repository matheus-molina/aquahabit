import React, { useState } from 'react';
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

  if (!isOpen) return null;

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
      onClose();
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-ocean-500/10 rounded-2xl border border-ocean-500/20 text-ocean-400">
            <Droplets className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Setup Corporal & Meta</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Personalize seu plano para calcular seu IMC e necessidade hídrica ideal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Peso e Altura */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-ocean-400" />
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
                className="w-full bg-slate-800/90 border border-slate-700 focus:border-ocean-500 text-white font-bold text-lg rounded-2xl px-4 py-3 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-ocean-400" />
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
                className="w-full bg-slate-800/90 border border-slate-700 focus:border-ocean-500 text-white font-bold text-lg rounded-2xl px-4 py-3 outline-none transition-all"
              />
            </div>
          </div>

          {/* Nível de Atividade Física */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-ocean-400" />
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
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    activityLevel === act.id
                      ? 'bg-ocean-600/30 border-ocean-400 text-white shadow-md'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-lg mb-1">{act.icon}</span>
                  <span className="text-xs font-bold block">{act.label}</span>
                  <span className="text-[10px] text-slate-400 block">{act.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Dinâmico do IMC e da Meta em Tempo Real */}
          <div className="p-4 bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-ocean-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Cálculo Instantâneo
                </span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 border ${imcResult.color}`}>
                {imcResult.classification}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Seu IMC</span>
                <span className={`text-lg font-black ${imcResult.color}`}>{imcResult.imc}</span>
              </div>

              <div className="p-2.5 bg-ocean-950/40 rounded-xl border border-ocean-800/60 text-center">
                <span className="text-[10px] text-ocean-300 block font-medium">Meta Diária Sugerida</span>
                <span className="text-lg font-black text-white">{formatWaterAmount(effectiveTarget)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              💡 {waterTargetResult.recommendation}
            </p>
          </div>

          {/* Opção para Meta Manual Customizada */}
          <div className="pt-1">
            {!isCustomizingTarget ? (
              <button
                type="button"
                onClick={() => setIsCustomizingTarget(true)}
                className="text-xs text-ocean-400 hover:text-ocean-300 underline font-medium"
              >
                Prefiro definir uma meta personalizada em ml
              </button>
            ) : (
              <div className="space-y-1.5 p-3 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
                <label className="text-xs font-bold text-slate-300">
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
                    className="flex-1 bg-slate-900 border border-slate-700 text-white font-bold rounded-xl px-3 py-2 text-sm outline-none focus:border-ocean-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomizingTarget(false);
                      setCustomTarget('');
                    }}
                    className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                  >
                    Usar Sugerida
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || weightKg <= 0 || heightCm <= 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold text-white bg-ocean-600 hover:bg-ocean-500 active:scale-95 disabled:opacity-50 transition shadow-lg shadow-ocean-600/30"
            >
              {isSubmitting ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <span>Salvar & Continuar</span>
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
