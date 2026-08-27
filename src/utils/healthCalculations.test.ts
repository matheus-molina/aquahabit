import { describe, it, expect } from 'vitest';
import {
  calculateIMC,
  calculateDailyWaterTarget,
  formatWaterAmount,
  calculateStreak,
  getLocalDateString,
} from './healthCalculations';
import { DailyLog } from '../types';

describe('Cálculos de Saúde - IMC e Meta de Hidratação', () => {
  describe('calculateIMC', () => {
    it('deve calcular corretamente o IMC para peso normal (70kg, 175cm)', () => {
      const result = calculateIMC(70, 175);
      // 70 / (1.75 * 1.75) = 22.86
      expect(result.imc).toBe(22.86);
      expect(result.classification).toBe('Peso normal');
      expect(result.minHealthyWeight).toBeGreaterThan(50);
      expect(result.maxHealthyWeight).toBeLessThan(80);
    });

    it('deve identificar "Abaixo do peso" para IMC < 18.5 (50kg, 175cm)', () => {
      const result = calculateIMC(50, 175);
      expect(result.imc).toBe(16.33);
      expect(result.classification).toBe('Abaixo do peso');
    });

    it('deve identificar "Sobrepeso" para IMC entre 25.0 e 29.9 (80kg, 170cm)', () => {
      const result = calculateIMC(80, 170);
      expect(result.imc).toBe(27.68);
      expect(result.classification).toBe('Sobrepeso');
    });

    it('deve identificar "Obesidade Grau I" para IMC entre 30.0 e 34.9 (95kg, 170cm)', () => {
      const result = calculateIMC(95, 170);
      expect(result.imc).toBe(32.87);
      expect(result.classification).toBe('Obesidade Grau I');
    });

    it('deve tratar entradas zeradas ou negativas com segurança', () => {
      const resultZero = calculateIMC(0, 170);
      expect(resultZero.imc).toBe(0);
      expect(resultZero.classification).toBe('Dados Inválidos');
    });
  });

  describe('calculateDailyWaterTarget', () => {
    it('deve calcular a meta para pessoa sedentária (70kg x 35ml = 2450ml)', () => {
      const result = calculateDailyWaterTarget(70, 'sedentary');
      expect(result.targetMl).toBe(2450);
      expect(result.baseMultiplier).toBe(35);
    });

    it('deve calcular a meta para pessoa moderada (70kg x 40ml + 200ml = 3000ml)', () => {
      const result = calculateDailyWaterTarget(70, 'moderate');
      expect(result.targetMl).toBe(3000);
    });

    it('deve calcular a meta para atleta/intenso (80kg x 45ml + 500ml = 4100ml)', () => {
      const result = calculateDailyWaterTarget(80, 'intense');
      expect(result.targetMl).toBe(4100);
    });

    it('deve respeitar os limites de segurança (min 1500ml, max 5500ml)', () => {
      const lowResult = calculateDailyWaterTarget(25, 'sedentary');
      expect(lowResult.targetMl).toBeGreaterThanOrEqual(1500);

      const highResult = calculateDailyWaterTarget(200, 'intense');
      expect(highResult.targetMl).toBeLessThanOrEqual(5500);
    });
  });

  describe('formatWaterAmount', () => {
    it('deve formatar valores menores que 1000 em ml', () => {
      expect(formatWaterAmount(250)).toBe('250 ml');
      expect(formatWaterAmount(750)).toBe('750 ml');
    });

    it('deve formatar valores iguais ou maiores que 1000 em L', () => {
      expect(formatWaterAmount(1000)).toBe('1 L');
      expect(formatWaterAmount(2500)).toBe('2.5 L');
      expect(formatWaterAmount(3000)).toBe('3 L');
    });
  });

  describe('calculateStreak', () => {
    it('deve retornar 0 para lista vazia', () => {
      expect(calculateStreak([])).toBe(0);
    });

    it('deve calcular streak contínuo quando hoje e ontem foram completados', () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const logs: DailyLog[] = [
        { id: '1', user_id: 'u1', date: getLocalDateString(today), intake_ml: 2500, target_ml: 2500, completed: true },
        { id: '2', user_id: 'u1', date: getLocalDateString(yesterday), intake_ml: 2600, target_ml: 2500, completed: true },
        { id: '3', user_id: 'u1', date: getLocalDateString(twoDaysAgo), intake_ml: 2500, target_ml: 2500, completed: true },
      ];

      expect(calculateStreak(logs)).toBe(3);
    });
  });
});
