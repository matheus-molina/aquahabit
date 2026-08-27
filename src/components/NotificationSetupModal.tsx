import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, CheckCircle2, Sparkles, BellRing, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NotificationSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_SCHEDULES = [
  {
    id: '2x',
    name: '2x ao dia (Recomendado)',
    desc: 'Lembretes nos momentos chave da tarde',
    times: ['14:00', '17:00'],
    icon: '⚡',
  },
  {
    id: '3x',
    name: '3x ao dia (Equilibrado)',
    desc: 'Manhã, meio da tarde e fim do dia',
    times: ['10:00', '14:00', '18:00'],
    icon: '🌟',
  },
  {
    id: '4x',
    name: '4x ao dia (Foco Total)',
    desc: 'Ao longo de todo o dia',
    times: ['09:00', '13:00', '17:00', '20:00'],
    icon: '🎯',
  },
];

const AVAILABLE_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', 
  '18:00', '19:00', '20:00', '21:00'
];

export const NotificationSetupModal: React.FC<NotificationSetupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { profile, updateProfile, enablePushNotifications } = useAuth();
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['14:00', '17:00']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  // Drag-to-dismiss com Pointer Capture e trava superior
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startYRef = useRef<number>(0);

  // Sincronizar com o perfil ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      setIsClosing(false);
      setDragY(0);
      setIsDragging(false);

      if (profile?.reminder_times && profile.reminder_times.length > 0) {
        setSelectedTimes(profile.reminder_times);
      } else {
        setSelectedTimes(['14:00', '17:00']);
      }

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
  }, [isOpen, profile?.reminder_times]);

  if (!isOpen && !isClosing) return null;

  // Determinar preset ativo dinamicamente comparando os arrays
  const getActivePresetId = () => {
    const currentStr = [...selectedTimes].sort().join(',');
    for (const preset of PRESET_SCHEDULES) {
      if ([...preset.times].sort().join(',') === currentStr) {
        return preset.id;
      }
    }
    return 'custom';
  };

  const activePresetId = getActivePresetId();

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

  const handleSelectPreset = (preset: typeof PRESET_SCHEDULES[0]) => {
    setSelectedTimes(preset.times);
  };

  const toggleHour = (hour: string) => {
    if (selectedTimes.includes(hour)) {
      if (selectedTimes.length > 1) {
        setSelectedTimes(selectedTimes.filter(t => t !== hour));
      }
    } else {
      const updated = [...selectedTimes, hour].sort();
      setSelectedTimes(updated);
    }
  };

  const handleSaveNotificationSchedule = async () => {
    setIsSubmitting(true);
    try {
      // 1. Salvar os horários selecionados no perfil do usuário
      await updateProfile({
        reminder_enabled: true,
        reminder_times: selectedTimes,
        reminder_interval_minutes: 120,
      });

      // 2. Solicitar permissão e obter FCM Token se ainda não tiver
      try {
        await enablePushNotifications();
      } catch (err) {
        console.warn('Permissão de push pendente ou dispensada:', err);
      }

      localStorage.setItem('aquahabit_notification_prompted', 'true');
      handleSmoothClose();
    } catch (e) {
      console.error('Erro ao configurar notificações:', e);
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
        className={`bg-slate-850 border-t sm:border border-slate-700/80 rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl safe-bottom ${
          isClosing ? 'animate-sheet-exit' : hasEntered ? '' : 'animate-sheet-enter'
        }`}
      >
        {/* Barrinha Interativa no Topo com Pointer Capture & Trava Superior */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full py-3 -mt-3 mb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="w-14 h-1.5 bg-slate-600/80 hover:bg-slate-500 rounded-full transition-colors pointer-events-none" />
        </div>

        {/* Header com Ícone */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-750 shrink-0">
          <div className="p-2.5 rounded-2xl bg-ocean-500/15 border border-ocean-500/30 text-ocean-400">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white leading-tight">
              Lembretes de Hidratação
            </h2>
            <p className="text-[11px] text-slate-400 leading-tight">
              Receba avisos caso ainda não tenha bebido água no dia
            </p>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3.5 pr-0.5">
          {/* Presets de Frequência */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-ocean-400" />
              Com que frequência você deseja ser avisado?
            </label>

            <div className="space-y-2">
              {PRESET_SCHEDULES.map(preset => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all active:scale-98 flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-ocean-950/40 border-ocean-400 text-white shadow-md shadow-ocean-500/10'
                        : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl">{preset.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block leading-tight truncate">
                          {preset.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block leading-tight truncate mt-0.5">
                          {preset.desc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {preset.times.map(t => (
                        <span key={t} className="px-1.5 py-0.5 bg-slate-900 border border-slate-700/80 rounded-lg text-[10px] font-mono font-bold text-ocean-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seleção Personalizada de Horários */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-ocean-400" />
                Escolha os horários específicos:
              </label>
              <span className="text-[10px] text-ocean-400 font-bold">
                {selectedTimes.length} selecionado{selectedTimes.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {AVAILABLE_HOURS.map(hour => {
                const isActive = selectedTimes.includes(hour);
                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => toggleHour(hour)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-bold border transition-all active:scale-95 text-center ${
                      isActive
                        ? 'bg-ocean-500 text-white border-ocean-400 shadow-sm shadow-ocean-500/30 font-extrabold'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    {hour}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dica Informativa */}
          <div className="p-3 bg-slate-900/80 border border-slate-750 rounded-2xl flex items-start gap-2 text-[10px] text-slate-400 leading-tight">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              O robô inteligente só enviará notificações se você **ainda não tiver batido a meta ou ingerido água** naquele período!
            </span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2.5 pt-2 shrink-0">
          <button
            type="button"
            onClick={handleSmoothClose}
            className="flex-1 py-3 px-3 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-750 border border-slate-700/60 transition active:scale-95"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSubmitting || selectedTimes.length === 0}
            onClick={handleSaveNotificationSchedule}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl text-xs font-bold text-white bg-ocean-500 hover:bg-ocean-400 active:scale-95 disabled:opacity-50 transition shadow-lg shadow-ocean-500/25"
          >
            {isSubmitting ? (
              <span>Salvando...</span>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" />
                <span>Salvar Lembretes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
