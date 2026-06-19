import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { ProfileCrudService } from './profile-crud.service';
import { Answer, Question } from '../models/question.model';
import { PublicProfile } from '../models/user.model';
import { calculateAnswerCompatibility, calculateInterestCompatibility } from '../utils/compatibility.util';

@Injectable({ providedIn: 'root' })
export class CompatibilityService {
  private answersKey = 'cp_answers';

  readonly questions: Question[] = [
    { id: 1, text: 'Me gusta hablar con claridad cuando algo me incomoda.', category: 'comunicacion', weight: 2 },
    { id: 2, text: 'Busco una relacion tranquila, honesta y con respeto.', category: 'valores', weight: 2 },
    { id: 3, text: 'Prefiero planes tranquilos antes que salir de fiesta todo el tiempo.', category: 'estilo', weight: 1 },
    { id: 4, text: 'Para mi es importante tener metas personales claras.', category: 'metas', weight: 2 },
    { id: 5, text: 'Me gusta conocer a alguien con calma, sin presiones.', category: 'valores', weight: 2 },
    { id: 6, text: 'Disfruto conversaciones profundas sobre la vida y emociones.', category: 'comunicacion', weight: 1 },
    { id: 7, text: 'Valoro mucho el tiempo de calidad.', category: 'valores', weight: 2 },
    { id: 8, text: 'Me gusta compartir gustos como musica, peliculas o tecnologia.', category: 'intereses', weight: 1 },
    { id: 9, text: 'Cuando algo termina, prefiero cerrar con respeto y claridad.', category: 'comunicacion', weight: 2 },
    { id: 10, text: 'Me interesa una conexion real, no solo una coincidencia rapida.', category: 'metas', weight: 2 }
  ];

  constructor(
    private authService: AuthService,
    private profileCrudService: ProfileCrudService
  ) {}

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
    const storedProfiles = this.profileCrudService.getProfiles();

    if (!user || answers.length === 0) {
      return storedProfiles
        .map((profile) => ({ ...profile, compatibility: profile.compatibility ?? 80 }))
        .sort((a, b) => (b.compatibility ?? 0) - (a.compatibility ?? 0));
    }

    const userAnswerValues = this.questions.map((question) => {
      const found = answers.find((answer) => answer.questionId === question.id);
      return found?.value ?? 3;
    });

    return storedProfiles
      .map((profile) => {
        const answerScore = calculateAnswerCompatibility(userAnswerValues, profile.answers);
        const interestScore = calculateInterestCompatibility(user.interests, profile.interests);
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
        title: 'El Empatico Tranquilo',
        description: 'Conectas mejor con personas que valoran la calma, la honestidad y el tiempo de calidad.',
        traits: ['Empatia', 'Calma', 'Lealtad']
      };
    }

    if (average >= 3.5) {
      return {
        title: 'El Conector Autentico',
        description: 'Buscas equilibrio entre emocion, comunicacion y planes que tengan intencion real.',
        traits: ['Claridad', 'Curiosidad', 'Confianza']
      };
    }

    return {
      title: 'El Explorador Social',
      description: 'Disfrutas conocer personas nuevas y descubrir compatibilidad a traves de experiencias.',
      traits: ['Energia', 'Aventura', 'Apertura']
    };
  }
}
