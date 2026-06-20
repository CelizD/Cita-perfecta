import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

export interface OpenMeteoCurrent {
  temperature_2m: number;
  weather_code: number;
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrent;
}

export interface ExternalDatePlan {
  city: string;
  temperature: number | null;
  weatherLabel: string;
  suggestion: string;
  source: string;
  isFallback: boolean;
}

@Injectable({ providedIn: 'root' })
export class ExternalDatePlanService {
  private readonly tijuanaWeatherUrl =
    'https://api.open-meteo.com/v1/forecast?latitude=32.5149&longitude=-117.0382&current=temperature_2m,weather_code&timezone=auto';

  constructor(private http: HttpClient) {}

  getTijuanaPlan(): Observable<ExternalDatePlan> {
    return this.http.get<OpenMeteoResponse>(this.tijuanaWeatherUrl).pipe(
      map((response) => this.toDatePlan(response.current)),
      catchError(() => of(this.fallbackPlan()))
    );
  }

  createPlanFromWeather(current: OpenMeteoCurrent): ExternalDatePlan {
    return this.toDatePlan(current);
  }

  private toDatePlan(current: OpenMeteoCurrent): ExternalDatePlan {
    const weatherLabel = this.getWeatherLabel(current.weather_code);
    return {
      city: 'Tijuana',
      temperature: Math.round(current.temperature_2m),
      weatherLabel,
      suggestion: this.getSuggestion(current.temperature_2m, current.weather_code),
      source: 'Open-Meteo API',
      isFallback: false
    };
  }

  private fallbackPlan(): ExternalDatePlan {
    return {
      city: 'Tijuana',
      temperature: null,
      weatherLabel: 'sin datos en este momento',
      suggestion: 'Plan tranquilo: cafe, conversacion corta y lugar publico.',
      source: 'Open-Meteo API',
      isFallback: true
    };
  }

  private getSuggestion(temperature: number, weatherCode: number): string {
    if (weatherCode >= 51) {
      return 'Mejor plan bajo techo: cafe, cine o una cena tranquila.';
    }

    if (temperature >= 28) {
      return 'Plan fresco: helado, cafe con aire acondicionado o paseo corto al atardecer.';
    }

    if (temperature <= 12) {
      return 'Plan calido: chocolate, pan dulce y una conversacion sin prisa.';
    }

    return 'Buen clima para caminar, tomar cafe o elegir una primera cita sencilla.';
  }

  private getWeatherLabel(weatherCode: number): string {
    if (weatherCode === 0) return 'cielo despejado';
    if (weatherCode <= 3) return 'parcialmente nublado';
    if (weatherCode <= 48) return 'niebla';
    if (weatherCode <= 67) return 'lluvia';
    if (weatherCode <= 77) return 'granizo o nieve';
    if (weatherCode <= 82) return 'chubascos';
    return 'tormenta';
  }
}
