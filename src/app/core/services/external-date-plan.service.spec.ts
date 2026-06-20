import { describe, expect, it } from 'vitest';
import { ExternalDatePlanService } from './external-date-plan.service';

describe('ExternalDatePlanService', () => {
  it('creates a date plan from Open-Meteo weather data', () => {
    const service = new ExternalDatePlanService({} as any);

    const plan = service.createPlanFromWeather({
      temperature_2m: 29.4,
      weather_code: 0
    });

    expect(plan.city).toBe('Tijuana');
    expect(plan.temperature).toBe(29);
    expect(plan.weatherLabel).toBe('cielo despejado');
    expect(plan.source).toBe('Open-Meteo API');
    expect(plan.isFallback).toBe(false);
    expect(plan.suggestion).toContain('Plan fresco');
  });
});
