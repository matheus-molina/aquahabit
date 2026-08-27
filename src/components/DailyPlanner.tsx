import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  GlassWater, 
  Coffee, 
  Citrus, 
  Sparkles,
  Calendar as CalendarIcon,
  SmilePlus
} from 'lucide-react';
import { WaterEntry, BeverageType } from '../types';
import { formatWaterAmount, getLocalDateString } from '../utils/healthCalculations';

interface DailyPlannerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  entries: WaterEntry[];
  onDeleteEntry: (id: string) => void;
  onOpenCalendar: () => void;
}

const BEVERAGE_INFO: Record<BeverageType, { name: string; icon: any; color: string }> = {
  water: { name: 'Água Pura', icon: GlassWater, color: 'text-ocean-400 bg-ocean-500/10' },
  lemon_water: { name: 'Água com Limão', icon: Citrus, color: 'text-lime-400 bg-lime-500/10' },
  tea: { name: 'Chá Natural', icon: Coffee, color: 'text-emerald-400 bg-emerald-500/10' },
  coffee: { name: 'Café', icon: Coffee, color: 'text-amber-500 bg-amber-500/10' },
  juice: { name: 'Suco Natural', icon: Citrus, color: 'text-orange-400 bg-orange-500/10' },
  sports: { name: 'Isotônico', icon: Sparkles, color: 'text-cyan-400 bg-cyan-500/10' },
};

export const DailyPlanner: React.FC<DailyPlannerProps> = ({
  selectedDate,
  onSelectDate,
  entries,
  onDeleteEntry,
  onOpenCalendar,
}) => {
  const todayStr = getLocalDateString(new Date());
  const isToday = selectedDate === todayStr;

  // Navegar dias
  const navigateDay = (offset: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);
    currentDate.setDate(currentDate.getDate() + offset);
    onSelectDate(getLocalDateString(currentDate));
  };

  // Formatar data para exibição amigável
  const [year, month, day] = selectedDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const formattedDay = format(dateObj, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="w-full space-y-4">
      {/* Navegador de Dias */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-sm">
        <button
          type="button"
          onClick={() => navigateDay(-1)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          aria-label="Dia anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-center">
          <button
            type="button"
            onClick={onOpenCalendar}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-800/80 transition group"
          >
            <CalendarIcon className="w-4 h-4 text-ocean-400 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="text-xs font-bold text-white capitalize block leading-tight">
                {isToday ? `Hoje • ${formattedDay}` : formattedDay}
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight">
                Toque para abrir calendário
              </span>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigateDay(1)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          aria-label="Próximo dia"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Linha do Tempo / Diário do Dia */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Diário de Ingestões ({entries.length})
          </h3>
          {entries.length > 0 && (
            <span className="text-xs font-semibold text-ocean-400">
              Total: {formatWaterAmount(entries.reduce((acc, curr) => acc + curr.amount_ml, 0))}
            </span>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-center">
            <SmilePlus className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">Nenhum registro neste dia</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Use os botões de adição acima para registrar seu primeiro copo de água!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const bev = BEVERAGE_INFO[entry.beverage_type || 'water'] || BEVERAGE_INFO.water;
              const Icon = bev.icon;
              const timeStr = entry.created_at
                ? format(parseISO(entry.created_at), 'HH:mm')
                : '--:--';

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-slate-900/70 hover:bg-slate-850 border border-slate-800/80 rounded-2xl transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${bev.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          +{formatWaterAmount(entry.amount_ml)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {bev.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Registrado às {timeStr}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteEntry(entry.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition opacity-80 group-hover:opacity-100"
                    title="Excluir este registro"
                  >
                    <Trash2 className="w-4 h-4" />
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
