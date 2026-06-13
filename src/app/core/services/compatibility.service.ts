import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Answer, Question } from '../models/question.model';
import { PublicProfile } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class CompatibilityService {
  private answersKey = 'cp_answers';

  readonly questions: Question[] = [
    { id: 1, text: 'Me gusta hablar con claridad cuando algo me incomoda.', category: 'comunicacion', weight: 2 },
    { id: 2, text: 'Busco una relación tranquila, honesta y con respeto.', category: 'valores', weight: 2 },
    { id: 3, text: 'Prefiero planes tranquilos antes que salir de fiesta todo el tiempo.', category: 'estilo', weight: 1 },
    { id: 4, text: 'Para mí es importante tener metas personales claras.', category: 'metas', weight: 2 },
    { id: 5, text: 'Me gusta conocer a alguien con calma, sin presiones.', category: 'valores', weight: 2 },
    { id: 6, text: 'Disfruto conversaciones profundas sobre la vida y emociones.', category: 'comunicacion', weight: 1 },
    { id: 7, text: 'Valoro mucho el tiempo de calidad.', category: 'valores', weight: 2 },
    { id: 8, text: 'Me gusta compartir gustos como música, películas o tecnología.', category: 'intereses', weight: 1 },
    { id: 9, text: 'Cuando algo termina, prefiero cerrar con respeto y claridad.', category: 'comunicacion', weight: 2 },
    { id: 10, text: 'Me interesa una conexión real, no solo una coincidencia rápida.', category: 'metas', weight: 2 }
  ];

  readonly demoProfiles: PublicProfile[] = [
    {
      id: 101,
      name: 'Ana',
      age: 22,
      city: 'Tijuana',
      bio: 'Me gusta el café, la música tranquila y las conversaciones honestas.',
      interests: ['Café', 'Música', 'Cine', 'Lectura'],
      traits: ['Empatía', 'Calma', 'Honestidad'],
      answers: [5, 5, 4, 4, 5, 5, 5, 4, 5, 5]
    },
    {
      id: 102,
      name: 'Luis',
      age: 24,
      city: 'Mexicali',
      bio: 'Apasionado por la tecnología, los viajes y aprender cosas nuevas.',
      interests: ['Tecnología', 'Viajes', 'Videojuegos', 'Gym'],
      traits: ['Ambición', 'Lealtad', 'Curiosidad'],
      answers: [4, 4, 3, 5, 4, 4, 4, 5, 4, 5]
    },
    {
      id: 103,
      name: 'Sofía',
      age: 21,
      city: 'Ensenada',
      bio: 'Amo el arte, los planes sencillos y conocer personas con buena energía.',
      interests: ['Arte', 'Cine', 'Café', 'Mascotas'],
      traits: ['Creatividad', 'Ternura', 'Paciencia'],
      answers: [5, 5, 5, 3, 5, 5, 4, 4, 5, 4]
    },
    {
      id: 104,
      name: 'Marcos',
      age: 25,
      city: 'Tijuana',
      bio: 'Me gusta entrenar, cocinar y construir una vida estable.',
      interests: ['Gym', 'Cocina', 'Familia', 'Viajes'],
      traits: ['Disciplina', 'Protección', 'Estabilidad'],
      answers: [3, 4, 2, 5, 3, 3, 4, 3, 4, 4]
    }
  ];

  constructor(private authService: AuthService) {}

  saveAnswers(answers: Answer[]): void {
    const user = this.authService.currentUser();
    if (!user) return;

    localStorage.setItem(`${this.answersKey}_${user.id}`, JSON.stringify(answers));
    this.authService.updateCurrentUser({ testComplete: true });
  }

  getAnswers(): Answer[] {
    const user = this.authService.currentUser();
    if (!user) return [];

    const raw = localStorage.getItem(`${this.answersKey}_${user.id}`);
    return raw ? (JSON.parse(raw) as Answer[]) : [];
  }

  getRecommendedProfiles(): PublicProfile[] {
    const user = this.authService.currentUser();
    const answers = this.getAnswers();

    if (!user || answers.length === 0) {
      return this.demoProfiles.map((profile, index) => ({ ...profile, compatibility: 80 - index * 4 }));
    }

    const userAnswerValues = this.questions.map((question) => {
      const found = answers.find((answer) => answer.questionId === question.id);
      return found?.value ?? 3;
    });

    return this.demoProfiles
      .map((profile) => {
        const answerScore = this.calculateAnswerScore(userAnswerValues, profile.answers);
        const interestScore = this.calculateInterestScore(user.interests, profile.interests);
        const compatibility = Math.round(answerScore * 0.75 + interestScore * 0.25);
        return { ...profile, compatibility };
      })
      .sort((a, b) => (b.compatibility ?? 0) - (a.compatibility ?? 0));
  }

  findProfile(id: number): PublicProfile | undefined {
    return this.getRecommendedProfiles().find((profile) => profile.id === id);
  }

  getAura(): { title: string; description: string; traits: string[] } {
    const values = this.getAnswers().map((answer) => answer.value);
    const average = values.length ? values.reduce((sum, item) => sum + item, 0) / values.length : 4;

    if (average >= 4.4) {
      return {
        title: 'El Empático Tranquilo',
        description: 'Conectas mejor con personas que valoran la calma, la honestidad y el tiempo de calidad.',
        traits: ['Empatía', 'Calma', 'Lealtad']
      };
    }

    if (average >= 3.5) {
      return {
        title: 'El Conector Auténtico',
        description: 'Buscas equilibrio entre emoción, comunicación y planes que tengan intención real.',
        traits: ['Claridad', 'Curiosidad', 'Confianza']
      };
    }

    return {
      title: 'El Explorador Social',
      description: 'Disfrutas conocer personas nuevas y descubrir compatibilidad a través de experiencias.',
      traits: ['Energía', 'Aventura', 'Apertura']
    };
  }

  private calculateAnswerScore(userAnswers: number[], profileAnswers: number[]): number {
    const maxDifference = userAnswers.length * 4;
    const totalDifference = userAnswers.reduce((sum, value, index) => sum + Math.abs(value - profileAnswers[index]), 0);
    return Math.max(0, 100 - (totalDifference / maxDifference) * 100);
  }

  private calculateInterestScore(userInterests: string[], profileInterests: string[]): number {
    if (userInterests.length === 0) return 70;
    const common = userInterests.filter((interest) => profileInterests.includes(interest)).length;
    return Math.min(100, 60 + common * 12);
  }
}
