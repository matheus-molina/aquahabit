import React from 'react';
import { Droplet, Award, Flame } from 'lucide-react';
import { formatWaterAmount } from '../utils/healthCalculations';

interface WaterRingProgressProps {
  intakeMl: number;
  targetMl: number;
  size?: number;
  strokeWidth?: number;
  isToday?: boolean;
}

export const WaterRingProgress: React.FC<WaterRingProgressProps> = ({
  intakeMl,
  targetMl,
  size = 260,
  strokeWidth = 18,
  isToday = true,
}) => {
  const percentage = targetMl > 0 ? Math.min(Math.round((intakeMl / targetMl) * 100), 200) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const isComplete = percentage >= 100;
  const remainingMl = Math.max(0, targetMl - intakeMl);

  return (
    <div className="relative flex flex-col items-center justify-center py-4">
      {/* SVG Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow Effect when 100%+ */}
        {isComplete && (
          <div 
            className="absolute inset-0 rounded-full bg-ocean-500/20 blur-xl animate-pulse-subtle"
            style={{ width: size, height: size }}
          />
        )}

        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-800/80"
          />

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="waterProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="completedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Active Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isComplete ? "url(#completedGradient)" : "url(#waterProgressGradient)"}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div className="flex items-center gap-1 mb-1">
            {isComplete ? (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Award className="w-3.5 h-3.5" /> Meta Batida!
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-ocean-400">
                <Droplet className="w-3.5 h-3.5 text-ocean-400 fill-ocean-400" />
                {isToday ? 'Hoje' : 'Registrado'}
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-center">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              {percentage}%
            </span>
          </div>

          <p className="text-xs sm:text-sm font-medium text-slate-300 mt-1">
            <strong className="text-ocean-300 font-bold text-base">{formatWaterAmount(intakeMl)}</strong>
            <span className="text-slate-400"> / {formatWaterAmount(targetMl)}</span>
          </p>

          {!isComplete ? (
            <p className="text-[11px] text-slate-400 mt-1">
              Faltam <strong className="text-white">{formatWaterAmount(remainingMl)}</strong>
            </p>
          ) : (
            <p className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" /> +{formatWaterAmount(intakeMl - targetMl)} extras!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
