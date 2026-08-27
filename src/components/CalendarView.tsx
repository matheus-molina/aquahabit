import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, Droplet, Flame, Trophy } from 'lucide-react';
import { DailyLog } from '../types';
import { getLocalDateString, calculateStreak, formatWaterAmount } from '../utils/healthCalculations';

interface CalendarViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  logs: DailyLog[];
  onClose?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onSelectDate,
  logs,
  onClose,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Domingo
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const streak = calculateStreak(logs);

  // Estatísticas do Mês Atual
  const currentMonthLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    return isSameMonth(logDate, currentMonth);
  });

  const completedDaysCount = currentMonthLogs.filter(l => l.completed).length;
  const totalWaterMonth = currentMonthLogs.reduce((acc, curr) => acc + curr.intake_ml, 0);

  return (
    <div className="w-full bg-slate-800/85 border border-slate-700/60 rounded-3xl p-4 shadow-xl space-y-4">
      {/* Header do Mês e Navegação */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <p className="text-[10px] text-slate-400">
            {completedDaysCount} dias com meta batida este mês
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-750/90 rounded-2xl p-1 border border-slate-700/60">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition active:scale-95"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="px-2 py-0.5 text-[11px] font-bold text-ocean-300 hover:bg-slate-700 rounded-xl transition active:scale-95"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition active:scale-95"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cards de Resumo Rápido */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2.5 p-2.5 bg-slate-850/80 border border-slate-700/70 rounded-2xl shadow-sm">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Sequência</span>
            <span className="text-sm font-extrabold text-white">{streak} {streak === 1 ? 'dia' : 'dias'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 bg-slate-850/80 border border-slate-700/70 rounded-2xl shadow-sm">
          <div className="p-2 rounded-xl bg-ocean-500/15 text-ocean-400">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Total no Mês</span>
            <span className="text-sm font-extrabold text-white">{formatWaterAmount(totalWaterMonth)}</span>
          </div>
        </div>
      </div>

      {/* Grade do Calendário */}
      <div>
        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {weekDays.map(day => (
            <span key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-0.5">
              {day}
            </span>
          ))}
        </div>

        {/* Células de Dias */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(day => {
            const dateKey = getLocalDateString(day);
            const isSelected = selectedDate === dateKey;
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);

            const log = logs.find(l => l.date === dateKey);
            const intake = log?.intake_ml || 0;
            const target = log?.target_ml || 2500;
            const percentage = target > 0 ? Math.min(Math.round((intake / target) * 100), 100) : 0;
            const isComplete = log?.completed || percentage >= 100;
            const hasIntake = intake > 0;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => {
                  onSelectDate(dateKey);
                  if (onClose) onClose();
                }}
                className={`relative flex flex-col items-center justify-center p-1.5 min-h-[48px] rounded-2xl transition-all duration-200 ${
                  !isCurrentMonth
                    ? 'opacity-30 hover:opacity-70'
                    : 'opacity-100'
                } ${
                  isSelected
                    ? 'ring-2 ring-ocean-400 bg-ocean-950/70 shadow-md shadow-ocean-500/20'
                    : 'hover:bg-slate-750 bg-slate-850/60 border border-slate-700/50'
                }`}
              >
                {/* Status Indicator Circle */}
                {isComplete ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mb-0.5 shadow-sm shadow-emerald-500/40">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                ) : hasIntake ? (
                  <div className="w-4 h-4 rounded-full bg-ocean-600/30 border border-ocean-400 text-ocean-300 flex items-center justify-center mb-0.5 text-[8px] font-extrabold">
                    <Droplet className="w-2 h-2 fill-ocean-400" />
                  </div>
                ) : (
                  <div className="w-4 h-4 flex items-center justify-center mb-0.5" />
                )}

                {/* Número do dia */}
                <span
                  className={`text-xs font-bold ${
                    isToday
                      ? 'text-ocean-400 underline underline-offset-2'
                      : isSelected
                      ? 'text-white'
                      : 'text-slate-200'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Micro barra */}
                {hasIntake && !isComplete && (
                  <div className="w-3.5 h-1 bg-slate-700 rounded-full mt-0.5 overflow-hidden">
                    <div 
                      className="h-full bg-ocean-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legenda do Calendário */}
      <div className="flex items-center justify-around pt-2 border-t border-slate-700/60 text-[10px] text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Meta 100%+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-ocean-600/40 border border-ocean-400" />
          <span>Parcial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-600" />
          <span>Sem registro</span>
        </div>
      </div>
    </div>
  );
};
