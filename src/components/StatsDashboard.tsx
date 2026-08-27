import React from 'react';
import { format, subDays } from 'date-fns';
import { Activity, Droplets, Target, Sparkles, Scale, HeartHandshake, Settings } from 'lucide-react';
import { DailyLog, UserProfile } from '../types';
import { calculateIMC, formatWaterAmount, getLocalDateString } from '../utils/healthCalculations';

interface StatsDashboardProps {
  logs: DailyLog[];
  profile: UserProfile | null;
  onEditProfile: () => void;
}

const DAY_ABBR: Record<number, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
};

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ logs, profile, onEditProfile }) => {
  const height = profile?.height_cm || 170;
  const weight = profile?.weight_kg || 70;
  const imcResult = calculateIMC(weight, height);

  // Gerar últimos 7 dias para o gráfico
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = getLocalDateString(d);
    const log = logs.find(l => l.date === dateStr);
    const intake = log?.intake_ml || 0;
    const target = log?.target_ml || profile?.daily_water_target_ml || 2500;
    const percentage = target > 0 ? Math.min(Math.round((intake / target) * 100), 150) : 0;

    return {
      dateStr,
      dayLabel: DAY_ABBR[d.getDay()] || format(d, 'EEE'),
      shortDate: format(d, 'dd/MM'),
      intake,
      target,
      percentage,
      isCompleted: log?.completed || intake >= target,
    };
  });

  const totalWeeklyIntake = last7Days.reduce((acc, curr) => acc + curr.intake, 0);
  const averageDailyIntake = Math.round(totalWeeklyIntake / 7);
  const completedWeeklyDays = last7Days.filter(d => d.isCompleted).length;

  return (
    <div className="w-full space-y-4">
      {/* Card de Resumo do IMC & Perfil Corporal */}
      <div className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-850 border border-slate-700/60 rounded-3xl p-4 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-ocean-500/15 text-ocean-400 border border-ocean-500/30">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white leading-tight">Perfil Corporal & IMC</h3>
              <p className="text-[10px] text-slate-400 leading-tight">Base para cálculo da meta</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onEditProfile}
            className="p-2 rounded-xl bg-slate-750 hover:bg-slate-700 text-ocean-300 hover:text-white border border-slate-700/80 transition active:scale-95 shadow-sm"
            title="Ajustar dados corporais e IMC"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Informações Numéricas do IMC */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-slate-850/80 border border-slate-700/60 rounded-2xl text-center shadow-sm">
            <span className="text-[10px] text-slate-400 font-medium block">Peso</span>
            <span className="text-sm font-extrabold text-white">{weight} kg</span>
          </div>

          <div className="p-2.5 bg-slate-850/80 border border-slate-700/60 rounded-2xl text-center shadow-sm">
            <span className="text-[10px] text-slate-400 font-medium block">Altura</span>
            <span className="text-sm font-extrabold text-white">{height} cm</span>
          </div>

          <div className="p-2.5 bg-slate-850/80 border border-slate-700/60 rounded-2xl text-center shadow-sm">
            <span className="text-[10px] text-slate-400 font-medium block">IMC Atual</span>
            <span className={`text-sm font-extrabold ${imcResult.color}`}>{imcResult.imc}</span>
          </div>
        </div>

        {/* Faixa e Classificação */}
        <div className="p-3 bg-slate-850/60 rounded-2xl border border-slate-700/60 flex items-start gap-2.5">
          <Sparkles className="w-3.5 h-3.5 text-ocean-400 mt-0.5 shrink-0" />
          <div className="text-[11px] space-y-0.5">
            <p className="text-slate-200">
              Classificação: <strong className={imcResult.color}>{imcResult.classification}</strong>
            </p>
            <p className="text-slate-400 text-[10px] leading-tight">
              {imcResult.description}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico Semanal dos Últimos 7 Dias */}
      <div className="bg-slate-800/85 border border-slate-700/60 rounded-3xl p-4 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-ocean-400" />
              Últimos 7 Dias
            </h3>
            <p className="text-[10px] text-slate-400">Consumo em relação à meta</p>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-500/30">
            {completedWeeklyDays}/7 metas batidas
          </span>
        </div>

        {/* Barras do Gráfico */}
        <div className="grid grid-cols-7 gap-1.5 pt-4 pb-1 items-end min-h-[140px]">
          {last7Days.map(item => {
            const barHeightPercent = Math.min(item.percentage, 100);
            return (
              <div key={item.dateStr} className="flex flex-col items-center gap-1.5 group min-w-0">
                {/* Tooltip / Valor no topo */}
                <span className="text-[9px] font-bold text-slate-400 group-hover:text-ocean-300 transition-colors truncate">
                  {formatWaterAmount(item.intake)}
                </span>

                {/* Trilho da Barra */}
                <div className="w-full max-w-[24px] h-24 bg-slate-750 rounded-xl overflow-hidden flex flex-col justify-end p-0.5 relative border border-slate-700/50">
                  {/* Linha da meta (100%) */}
                  <div className="absolute top-2 left-0 right-0 border-b border-dashed border-slate-500/50 z-10" />

                  {/* Barra de Progresso */}
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ${
                      item.isCompleted
                        ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-sm shadow-emerald-500/40'
                        : item.intake > 0
                        ? 'bg-gradient-to-t from-ocean-500 to-ocean-400'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${barHeightPercent}%` }}
                  />
                </div>

                {/* Dia da Semana */}
                <div className="text-center w-full min-w-0">
                  <span className="text-[10px] font-extrabold text-slate-200 block leading-tight truncate">
                    {item.dayLabel}
                  </span>
                  <span className="text-[9px] text-slate-400 block leading-tight truncate font-medium">
                    {item.shortDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Métricas Médias da Semana */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 p-2 bg-slate-850/80 rounded-xl border border-slate-700/50">
            <Droplets className="w-3.5 h-3.5 text-ocean-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] text-slate-400 block truncate">Média Diária</span>
              <span className="font-bold text-white text-xs truncate block">{formatWaterAmount(averageDailyIntake)} / dia</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-slate-850/80 rounded-xl border border-slate-700/50">
            <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] text-slate-400 block truncate">Total na Semana</span>
              <span className="font-bold text-white text-xs truncate block">{formatWaterAmount(totalWeeklyIntake)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dicas de Hidratação Inteligente */}
      <div className="bg-slate-850/80 border border-slate-700/60 rounded-3xl p-4 space-y-2 shadow-sm">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Dicas para o seu dia
          </h4>
        </div>
        <ul className="text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="text-ocean-400 font-bold">•</span>
            <span>Beba um copo de 250ml ao acordar para ativar seu metabolismo.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-ocean-400 font-bold">•</span>
            <span>Mantenha sua garrafinha sempre por perto durante o dia.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
