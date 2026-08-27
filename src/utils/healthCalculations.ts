import { ActivityLevel, Gender, IMCResult, WaterTargetResult, DailyLog } from '../types';

/**
 * Calcula o Índice de Massa Corporal (IMC) e retorna a classificação detalhada.
 * Fórmula: IMC = peso (kg) / (altura (m))²
 */
export function calculateIMC(weightKg: number, heightCm: number): IMCResult {
  if (weightKg <= 0 || heightCm <= 0) {
    return {
      imc: 0,
      classification: 'Dados Inválidos',
      color: 'text-slate-400',
      description: 'Informe peso e altura válidos.',
      minHealthyWeight: 0,
      maxHealthyWeight: 0,
    };
  }

  const heightMeters = heightCm / 100;
  const imcRaw = weightKg / (heightMeters * heightMeters);
  const imc = Math.round(imcRaw * 100) / 100;

  const minHealthyWeight = Math.round(18.5 * heightMeters * heightMeters * 10) / 10;
  const maxHealthyWeight = Math.round(24.9 * heightMeters * heightMeters * 10) / 10;

  if (imc < 18.5) {
    return {
      imc,
      classification: 'Abaixo do peso',
      color: 'text-amber-400',
      description: 'Seu IMC indica peso abaixo do recomendado. Mantenha boa hidratação e nutrição.',
      minHealthyWeight,
      maxHealthyWeight,
    };
  } else if (imc <= 24.9) {
    return {
      imc,
      classification: 'Peso normal',
      color: 'text-emerald-400',
      description: 'Parabéns! Seu IMC está dentro da faixa considerada saudável.',
      minHealthyWeight,
      maxHealthyWeight,
    };
  } else if (imc <= 29.9) {
    return {
      imc,
      classification: 'Sobrepeso',
      color: 'text-yellow-400',
      description: 'Seu IMC está na faixa de sobrepeso. A hidratação adequada auxilia no metabolismo.',
      minHealthyWeight,
      maxHealthyWeight,
    };
  } else if (imc <= 34.9) {
    return {
      imc,
      classification: 'Obesidade Grau I',
      color: 'text-orange-400',
      description: 'Atenção aos hábitos saudáveis. Água é essencial para o funcionamento metabólico.',
      minHealthyWeight,
      maxHealthyWeight,
    };
  } else if (imc <= 39.9) {
    return {
      imc,
      classification: 'Obesidade Grau II',
      color: 'text-rose-400',
      description: 'Acompanhamento de saúde recomendado. Hidratação reforçada é indispensável.',
      minHealthyWeight,
      maxHealthyWeight,
    };
  } else {
    return {
      imc,
      classification: 'Obesidade Grau III',
      color: 'text-red-500',
      description: 'Acompanhamento médico prioritário. Beba água regularmente durante o dia.',
      minHealthyWeight,
      maxHealthyWeight,
    };
  }
}

/**
 * Calcula a meta diária de água recomendada em mililitros (ml)
 * Base: 35ml/kg (sedentário), 40ml/kg (moderado), 45ml/kg (intenso/atleta)
 */
export function calculateDailyWaterTarget(
  weightKg: number,
  activityLevel: ActivityLevel = 'moderate',
  _gender: Gender = 'other',
  _heightCm?: number
): WaterTargetResult {
  if (weightKg <= 0) {
    return {
      targetMl: 2000,
      baseMultiplier: 35,
      activityBonusMl: 0,
      recommendation: 'Meta padrão recomendada de 2000 ml.',
    };
  }

  let multiplier = 35; // Sedentário
  let bonus = 0;
  let recommendation = '';

  switch (activityLevel) {
    case 'sedentary':
      multiplier = 35;
      recommendation = 'Base de 35ml/kg para rotinas com pouco esforço físico.';
      break;
    case 'moderate':
      multiplier = 40;
      bonus = 200;
      recommendation = 'Base de 40ml/kg + compensação para atividades moderadas.';
      break;
    case 'intense':
      multiplier = 45;
      bonus = 500;
      recommendation = 'Base de 45ml/kg + reposição para treinos intensos e atletas.';
      break;
  }

  // Cálculo e arredondamento para múltiplos de 50ml mais próximos
  const calculated = (weightKg * multiplier) + bonus;
  const roundedTarget = Math.round(calculated / 50) * 50;

  // Limites saudáveis e realistas (mínimo 1500ml, máximo 5500ml)
  const targetMl = Math.min(Math.max(roundedTarget, 1500), 5500);

  return {
    targetMl,
    baseMultiplier: multiplier,
    activityBonusMl: bonus,
    recommendation,
  };
}

/**
 * Formata mililitros em representação legível (ml ou Litros)
 */
export function formatWaterAmount(ml: number): string {
  if (ml >= 1000) {
    const liters = ml / 1000;
    return liters % 1 === 0 ? `${liters} L` : `${liters.toFixed(1)} L`;
  }
  return `${ml} ml`;
}

/**
 * Calcula a sequência de dias consecutivos com meta batida (Streak)
 */
export function calculateStreak(dailyLogs: DailyLog[]): number {
  if (!dailyLogs || dailyLogs.length === 0) return 0;

  // Ordenar logs por data descendente
  const sortedLogs = [...dailyLogs].sort((a, b) => b.date.localeCompare(a.date));

  const todayStr = getLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  let streak = 0;
  let checkDate = new Date();

  // Se hoje não foi concluído ainda, verificar se ontem foi para não quebrar a sequência antes do fim do dia
  const todayLog = sortedLogs.find(l => l.date === todayStr);
  if (todayLog && todayLog.completed) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    const yesterdayLog = sortedLogs.find(l => l.date === yesterdayStr);
    if (!yesterdayLog || !yesterdayLog.completed) {
      return 0;
    }
    // Começa a contar de ontem
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateKey = getLocalDateString(checkDate);
    const log = sortedLogs.find(l => l.date === dateKey);
    if (log && log.completed) {
      if (dateKey !== todayStr) streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Retorna string de data no formato local YYYY-MM-DD
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
