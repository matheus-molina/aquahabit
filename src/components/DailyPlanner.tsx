import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  GlassWater, 
  Calendar as CalendarIcon,
  SmilePlus,
  Bell,
  BellRing,
  CheckCircle2,
  Send
} from 'lucide-react';
import { WaterEntry } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatWaterAmount, getLocalDateString } from '../utils/healthCalculations';

interface DailyPlannerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  entries: WaterEntry[];
  onDeleteEntry: (id: string) => void;
  onOpenCalendar: () => void;
  onOpenNotifications: () => void;
}

export const DailyPlanner: React.FC<DailyPlannerProps> = ({
  selectedDate,
  onSelectDate,
  entries,
  onDeleteEntry,
  onOpenCalendar,
  onOpenNotifications,
}) => {
  const { profile } = useAuth();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isSendingTest, setIsSendingTest] = useState(false);

  const todayStr = getLocalDateString(new Date());
  const isToday = selectedDate === todayStr;

  const hasFcmToken = Boolean(profile?.reminder_enabled);

  // Disparo de teste imediato no dispositivo
  const handleSendTestPush = async () => {
    setIsSendingTest(true);
    const timesStr = profile?.reminder_times?.join(', ') || '14:00 e 17:00';
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification('Hora de se hidratar! 💧', {
          body: `Teste de notificação push: Tudo pronto para seus lembretes diários às ${timesStr}!`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/water-drop.svg',
          tag: 'test-hydration',
        } as any);
      } else if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Hora de se hidratar! 💧', {
          body: `Teste de notificação push: Tudo pronto para seus lembretes diários às ${timesStr}!`,
          icon: '/icons/icon-192x192.png',
        });
      }
    } catch (e) {
      console.error('Erro ao disparar push test:', e);
    } finally {
      setTimeout(() => setIsSendingTest(false), 1000);
    }
  };

  // Navegar dias
  const navigateDay = (offset: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);
    currentDate.setDate(currentDate.getDate() + offset);
    onSelectDate(getLocalDateString(currentDate));
  };

  // Excluir com animação de slide-out / fade-out
  const handleDeleteWithAnimation = (id: string) => {
    if (deletingIds.has(id)) return;

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([25, 35]);
      } catch (_) {}
    }

    setDeletingIds(prev => new Set(prev).add(id));

    setTimeout(() => {
      onDeleteEntry(id);
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  // Formatar data para exibição amigável
  const [year, month, day] = selectedDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const formattedDay = format(dateObj, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="w-full space-y-3.5">
      {/* Navegador de Dias */}
      <div className="flex items-center justify-between bg-slate-800/80 border border-slate-750 rounded-2xl p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => navigateDay(-1)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-750 rounded-xl transition active:scale-95"
          aria-label="Dia anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenCalendar}
          className="flex items-center gap-2 px-3 py-1 rounded-xl hover:bg-slate-750/80 transition active:scale-98 group"
        >
          <CalendarIcon className="w-4 h-4 text-ocean-400 group-hover:scale-110 transition-transform" />
          <div className="text-left">
            <span className="text-xs font-bold text-white capitalize block leading-tight">
              {isToday ? `Hoje • ${formattedDay}` : formattedDay}
            </span>
            <span className="text-[9px] text-slate-400 block leading-tight">
              Toque para abrir calendário
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigateDay(1)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-750 rounded-xl transition active:scale-95"
          aria-label="Próximo dia"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Banner / Card de Notificações Push com Botão de Ajustar e Push Test */}
      {!hasFcmToken ? (
        <div className="p-3 bg-gradient-to-r from-ocean-950/60 via-slate-850 to-slate-850 border border-ocean-800/40 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-ocean-500/15 text-ocean-400 border border-ocean-500/30 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block leading-tight truncate">
                Lembretes diários
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight truncate mt-0.5">
                Escolha os horários e seja avisado
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenNotifications}
            className="shrink-0 px-3 py-1.5 bg-ocean-500 hover:bg-ocean-400 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-md shadow-ocean-500/20 flex items-center gap-1.5"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Configurar</span>
          </button>
        </div>
      ) : (
        <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl flex items-center justify-between gap-2 text-xs text-emerald-300 shadow-sm">
          <button
            type="button"
            onClick={onOpenNotifications}
            className="flex items-center gap-2 min-w-0 text-left hover:opacity-85 transition"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-white block leading-tight truncate">
                Lembretes ativos ({profile?.reminder_times?.join(', ') || '14:00, 17:00'})
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight truncate mt-0.5">
                Toque para editar horários
              </span>
            </div>
          </button>

          <button
            type="button"
            disabled={isSendingTest}
            onClick={handleSendTestPush}
            className="shrink-0 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-ocean-300 hover:text-white border border-slate-700 rounded-xl text-[11px] font-bold transition active:scale-95 flex items-center gap-1 shadow-sm"
            title="Disparar notificação de teste agora"
          >
            <Send className="w-3 h-3 text-ocean-400" />
            <span>{isSendingTest ? 'Enviando...' : 'Push Test'}</span>
          </button>
        </div>
      )}

      {/* Linha do Tempo / Diário do Dia */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Diário de Ingestões ({entries.length})
          </h3>
          {entries.length > 0 && (
            <span className="text-[11px] font-bold text-ocean-400">
              Total: {formatWaterAmount(entries.reduce((acc, curr) => acc + curr.amount_ml, 0))}
            </span>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 bg-slate-800/40 border border-dashed border-slate-700/80 rounded-2xl text-center">
            <SmilePlus className="w-8 h-8 text-slate-500 mb-1.5" />
            <p className="text-xs font-semibold text-slate-300">Nenhum registro neste dia</p>
            <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
              Toque nos recipientes acima para registrar seu consumo de água.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {entries.map((entry) => {
              const isDeleting = deletingIds.has(entry.id);
              const timeStr = entry.created_at
                ? format(parseISO(entry.created_at), 'HH:mm')
                : '--:--';

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-2.5 bg-slate-800/80 border rounded-2xl transition-all duration-300 ease-out origin-right shadow-sm ${
                    isDeleting
                      ? 'translate-x-full opacity-0 scale-90 border-transparent max-h-0 py-0 my-0 overflow-hidden pointer-events-none'
                      : 'hover:bg-slate-750 border-slate-700/70 max-h-24 opacity-100 scale-100 group'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border transition-colors ${
                      isDeleting
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'text-ocean-400 bg-ocean-500/10 border-ocean-500/20'
                    }`}>
                      <GlassWater className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block leading-tight">
                        +{formatWaterAmount(entry.amount_ml)}
                      </span>
                      <span className="text-[10px] text-slate-400 block leading-tight mt-0.5 font-medium">
                        Registrado às {timeStr}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDeleteWithAnimation(entry.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition opacity-80 group-hover:opacity-100 active:scale-90"
                    title="Excluir este registro"
                  >
                    <Trash2 className={`w-4 h-4 transition-transform ${isDeleting ? 'scale-125 text-rose-400 animate-spin' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
