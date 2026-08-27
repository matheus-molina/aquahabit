import React from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, Droplets, Target, Sparkles, Scale, HeartHandshake } from 'lucide-react';
import { DailyLog, UserProfile } from '../types';
import { calculateIMC, formatWaterAmount, getLocalDateString } from '../utils/healthCalculations';

interface StatsDashboardProps {
  logs: DailyLog[];
  profile: UserProfile | null;
  onEditProfile: () => void;
}

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
      dayLabel: format(d, 'EEE', { locale: ptBR }),
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
    <div className="w-full space-y-5">
      {/* Card de Resumo do IMC & Perfil Corporal */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-ocean-500/10 text-ocean-400 border border-ocean-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Perfil Corporal & IMC</h3>
              <p className="text-xs text-slate-400">Base para o cálculo da sua meta hídrica</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onEditProfile}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-ocean-300 border border-slate-700 transition"
          >
            Ajustar Dados
          </button>
        </div>

        {/* Informações Numéricas do IMC */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-center">
            <span className="text-[11px] text-slate-400 font-medium block">Peso</span>
            <span className="text-base font-extrabold text-white">{weight} kg</span>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-center">
            <span className="text-[11px] text-slate-400 font-medium block">Altura</span>
            <span className="text-base font-extrabold text-white">{height} cm</span>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-center">
            <span className="text-[11px] text-slate-400 font-medium block">IMC Atual</span>
            <span className={`text-base font-extrabold ${imcResult.color}`}>{imcResult.imc}</span>
          </div>
        </div>

        {/* Faixa e Classificação */}
        <div className="p-3.5 bg-slate-950/40 rounded-2xl border border-slate-800/60 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-ocean-400 mt-0.5 shrink-0" />
          <div className="text-xs space-y-1">
            <p className="text-slate-200">
              Classificação: <strong className={imcResult.color}>{imcResult.classification}</strong>
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {imcResult.description}
            </p>
            <p className="text-slate-400 text-[11px]">
              Faixa de peso saudável estimada: <strong className="text-slate-300">{imcResult.minHealthyWeight} kg a {imcResult.maxHealthyWeight} kg</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico Semanal dos Últimos 7 Dias */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-ocean-400" />
              Histórico dos Últimos 7 Dias
            </h3>
            <p className="text-xs text-slate-400">Consumo diário em relação à meta</p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
            {completedWeeklyDays}/7 metas batidas
          </span>
        </div>

        {/* Barras do Gráfico */}
        <div className="grid grid-cols-7 gap-2 pt-6 pb-2 items-end min-h-[160px]">
          {last7Days.map(item => {
            const barHeightPercent = Math.min(item.percentage, 100);
            return (
              <div key={item.dateStr} className="flex flex-col items-center gap-2 group">
                {/* Tooltip / Valor no topo */}
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-ocean-300 transition-colors">
                  {formatWaterAmount(item.intake)}
                </span>

                {/* Trilho da Barra */}
                <div className="w-full max-w-[28px] h-28 bg-slate-800/80 rounded-xl overflow-hidden flex flex-col justify-end p-1 relative">
                  {/* Linha da meta (100%) */}
                  <div className="absolute top-2 left-0 right-0 border-b border-dashed border-slate-600/60 z-10" />

                  {/* Barra de Progresso */}
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ${
                      item.isCompleted
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm shadow-emerald-500/50'
                        : item.intake > 0
                        ? 'bg-gradient-to-t from-ocean-600 to-ocean-400'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${barHeightPercent}%` }}
                  />
                </div>

                {/* Dia da Semana */}
                <div className="text-center">
                  <span className="text-[11px] font-bold text-slate-300 block capitalize">
                    {item.dayLabel}
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {item.shortDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Métricas Médias da Semana */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2.5 p-2.5 bg-slate-800/40 rounded-xl">
            <Droplets className="w-4 h-4 text-ocean-400" />
            <div>
              <span className="text-[10px] text-slate-400 block">Média Diária</span>
              <span className="font-bold text-white">{formatWaterAmount(averageDailyIntake)} / dia</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 bg-slate-800/40 rounded-xl">
            <Target className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-400 block">Total na Semana</span>
              <span className="font-bold text-white">{formatWaterAmount(totalWeeklyIntake)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dicas de Hidratação Inteligente */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-rose-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Dicas para manter o hábito
          </h4>
        </div>
        <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-ocean-400 font-bold">•</span>
            <span>Tome um copo de 250ml assim que acordar para ativar o metabolismo.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-400 font-bold">•</span>
            <span>Mantenha uma garrafa de 500ml à vista no seu local de trabalho ou estudo.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ocean-400 font-bold">•</span>
            <span>Adicione fatias de limão ou folhas de hortelã se preferir água saborizada.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
