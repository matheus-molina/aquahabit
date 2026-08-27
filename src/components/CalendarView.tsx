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
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-5">
      {/* Header do Mês e Navegação */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <p className="text-xs text-slate-400">
            {completedDaysCount} dias com meta atingida este mês
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800/80 rounded-2xl p-1 border border-slate-700/50">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="px-2.5 py-1 text-xs font-semibold text-ocean-300 hover:bg-slate-700 rounded-xl transition"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards de Resumo Rápido */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Sequência Atual</span>
            <span className="text-base font-extrabold text-white">{streak} {streak === 1 ? 'dia' : 'dias'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl">
          <div className="p-2.5 rounded-xl bg-ocean-500/10 text-ocean-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Total no Mês</span>
            <span className="text-base font-extrabold text-white">{formatWaterAmount(totalWaterMonth)}</span>
          </div>
        </div>
      </div>

      {/* Grade do Calendário */}
      <div>
        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekDays.map(day => (
            <span key={day} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1">
              {day}
            </span>
          ))}
        </div>

        {/* Células de Dias */}
        <div className="grid grid-cols-7 gap-1.5">
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
                className={`relative flex flex-col items-center justify-center p-2 min-h-[52px] rounded-2xl transition-all duration-200 ${
                  !isCurrentMonth
                    ? 'opacity-30 hover:opacity-70'
                    : 'opacity-100'
                } ${
                  isSelected
                    ? 'ring-2 ring-ocean-400 bg-ocean-950/60 shadow-lg shadow-ocean-500/20'
                    : 'hover:bg-slate-800/80 bg-slate-900/40 border border-slate-800/60'
                }`}
              >
                {/* Status Indicator Circle */}
                {isComplete ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mb-0.5 shadow-sm shadow-emerald-500/40">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : hasIntake ? (
                  <div className="w-5 h-5 rounded-full bg-ocean-600/30 border border-ocean-400 text-ocean-300 flex items-center justify-center mb-0.5 text-[9px] font-extrabold">
                    <Droplet className="w-2.5 h-2.5 fill-ocean-400" />
                  </div>
                ) : (
                  <div className="w-5 h-5 flex items-center justify-center mb-0.5" />
                )}

                {/* Número do dia */}
                <span
                  className={`text-xs font-bold ${
                    isToday
                      ? 'text-ocean-400 underline underline-offset-2'
                      : isSelected
                      ? 'text-white'
                      : 'text-slate-300'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Micro barra ou porcentagem */}
                {hasIntake && !isComplete && (
                  <div className="w-4 h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
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
      <div className="flex items-center justify-around pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Meta 100%+</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-ocean-600/40 border border-ocean-400" />
          <span>Parcial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700" />
          <span>Sem registro</span>
        </div>
      </div>
    </div>
  );
};
