import { Injectable } from '@angular/core';

export interface WeatherData {
  city: string;
  temp: number;
  description: string;
  suggestion: string;
  emoji: string;
}

// Open-Meteo weather codes → label + emoji + cita suggestion
function interpretCode(code: number): { description: string; emoji: string; suggestion: string } {
  if (code === 0) return { description: 'Despejado', emoji: '☀️', suggestion: 'Perfecto para un picnic o paseo al aire libre' };
  if (code <= 2) return { description: 'Mayormente despejado', emoji: '🌤️', suggestion: 'Ideal para un cafe en terraza' };
  if (code === 3) return { description: 'Nublado', emoji: '☁️', suggestion: 'Dia de museo, galeria o cine' };
  if (code <= 48) return { description: 'Niebla', emoji: '🌫️', suggestion: 'Cena romantica en casa o restaurante' };
  if (code <= 55) return { description: 'Llovizna', emoji: '🌦️', suggestion: 'Tarde de cafe y conversacion' };
  if (code <= 65) return { description: 'Lluvia', emoji: '🌧️', suggestion: 'Pelicula, juegos de mesa o cocinar juntos' };
  if (code <= 75) return { description: 'Nieve', emoji: '❄️', suggestion: 'Chocolate caliente y una buena charla' };
  if (code <= 82) return { description: 'Chubascos', emoji: '🌨️', suggestion: 'Tarde tranquila en casa' };
  return { description: 'Tormenta', emoji: '⛈️', suggestion: 'Queden en casa y cocinen algo rico' };
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  async getWeatherForCity(city: string): Promise<WeatherData | null> {
    if (!city?.trim()) return null;

    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=es&format=json`
      );
      if (!geoRes.ok) return null;

      const geoData = await geoRes.json() as { results?: { latitude: number; longitude: number; name: string }[] };
      const place = geoData.results?.[0];
      if (!place) return null;

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&timezone=auto`
      );
      if (!weatherRes.ok) return null;

      const weatherData = await weatherRes.json() as {
        current?: { temperature_2m: number; weather_code: number };
      };
      const current = weatherData.current;
      if (!current) return null;

      const { description, emoji, suggestion } = interpretCode(current.weather_code);

      return {
        city: place.name,
        temp: Math.round(current.temperature_2m),
        description,
        emoji,
        suggestion
      };
    } catch {
      return null;
    }
  }
}
