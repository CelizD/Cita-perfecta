import { Injectable, Optional } from '@angular/core';
import { AuthService } from './auth.service';
import { ProfileCrudService } from './profile-crud.service';
import { Answer, Question } from '../models/question.model';
import { PublicProfile } from '../models/user.model';
import { calculateAnswerCompatibility, calculateInterestCompatibility } from '../utils/compatibility.util';
import { SupabaseService } from '../../services/supabase.service';

interface DbQuestion {
  id: number;
  text: string;
  category: string;
  weight?: number;
}

interface DbAnswer {
  question_id: number;
  value: number;
}

export interface CompatibleProfile {
  id: string;
  email?: string;
  full_name?: string;
  city?: string;
  bio?: string;
  photo_url?: string;
  interests?: string[];
  dealbreakers?: string[];
  compatibility: number;
}

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
    private profileCrudService: ProfileCrudService,
    @Optional() private supabase?: SupabaseService
  ) {}

  async getQuestions(): Promise<DbQuestion[]> {
    const response = await this.supabase?.getInitialQuestions();
    return ((response?.data ?? []) as DbQuestion[]).sort((a, b) => a.id - b.id);
  }

  async getUserAnswers(userId: string): Promise<DbAnswer[]> {
    const { data, error } = await this.supabase!.getAnswers(userId);
    if (error) throw error;
    return (data ?? []) as DbAnswer[];
  }

  async calculateCompatibility(userIdA: string, userIdB: string): Promise<number> {
    const [questions, answersA, answersB] = await Promise.all([
      this.getQuestions(),
      this.getUserAnswers(userIdA),
      this.getUserAnswers(userIdB)
    ]);

    const answersByA = new Map(answersA.map((answer) => [answer.question_id, answer.value]));
    const answersByB = new Map(answersB.map((answer) => [answer.question_id, answer.value]));
    const commonQuestions = questions.filter((question) => answersByA.has(question.id) && answersByB.has(question.id));

    if (commonQuestions.length < 5) return 0;

    const categoryWeights: Record<string, number> = {
      valores: 0.25,
      metas: 0.2,
      comunicacion: 0.2,
      apego: 0.15,
      estilo: 0.08,
      estilo_de_vida: 0.08,
      intereses: 0.05,
      otros: 0.07
    };

    const categoryScores = new Map<string, { score: number; weight: number }>();

    for (const question of commonQuestions) {
      const valueA = answersByA.get(question.id) ?? 3;
      const valueB = answersByB.get(question.id) ?? 3;
      const closeness = 100 - Math.abs(valueA - valueB) * 25;
      const questionWeight = question.weight ?? 1;
      const category = this.normalizeCategory(question.category);
      const current = categoryScores.get(category) ?? { score: 0, weight: 0 };

      categoryScores.set(category, {
        score: current.score + closeness * questionWeight,
        weight: current.weight + questionWeight
      });
    }

    let weightedScore = 0;
    let usedWeight = 0;

    for (const [category, item] of categoryScores.entries()) {
      const categoryWeight = categoryWeights[category] ?? categoryWeights['otros'];
      weightedScore += (item.score / item.weight) * categoryWeight;
      usedWeight += categoryWeight;
    }

    return usedWeight ? Math.round(weightedScore / usedWeight) : 0;
  }

  async getCompatibleProfiles(userId: string, limit = 20): Promise<CompatibleProfile[]> {
    const [profilesResponse, blocksResponse, reportsResponse, currentProfileResponse] = await Promise.all([
      this.supabase!.getProfilesForCompatibility(userId, 100),
      this.supabase!.getBlocksForUser(userId),
      this.supabase!.getReportsByUser(userId),
      this.supabase!.getProfile(userId)
    ]);

    if (profilesResponse.error) throw profilesResponse.error;

    const blocks = (blocksResponse.data ?? []) as Array<Record<string, unknown>>;
    const reports = (reportsResponse.data ?? []) as Array<Record<string, unknown>>;
    const blockedIds = new Set<string>();
    for (const block of blocks) {
      blockedIds.add(block['blocker_id'] as string);
      blockedIds.add(block['blocked_user_id'] as string);
    }

    const reportedIds = new Set(reports.map((report) => report['reported_user_id'] as string));
    const currentDealbreakers = (currentProfileResponse.data?.['dealbreakers'] ?? []) as string[];
    const results: CompatibleProfile[] = [];

    for (const profile of profilesResponse.data ?? []) {
      const profileId = profile['id'] as string;
      if (blockedIds.has(profileId) || reportedIds.has(profileId)) continue;
      if (this.hasDealbreakerOverlap(currentDealbreakers, (profile['dealbreakers'] ?? []) as string[])) continue;

      const compatibility = await this.calculateCompatibility(userId, profileId);
      if (compatibility <= 0) continue;

      results.push({
        ...(profile as CompatibleProfile),
        compatibility
      });
    }

    return results.sort((a, b) => b.compatibility - a.compatibility).slice(0, limit);
  }

  saveAnswers(answers: Answer[]): void;
  saveAnswers(userId: string, answers: { question_id: number; value: number }[]): Promise<void>;
  saveAnswers(first: Answer[] | string, second?: { question_id: number; value: number }[]): void | Promise<void> {
    if (typeof first === 'string') {
      return this.saveSupabaseAnswers(first, second ?? []);
    }

    const user = this.authService.currentUser();
    if (!user) return;

    localStorage.setItem(`${this.answersKey}_${user.id}`, JSON.stringify(first));
    this.authService.updateCurrentUser({ testComplete: true });
  }

  private async saveSupabaseAnswers(userId: string, answers: { question_id: number; value: number }[]): Promise<void> {
    const { error } = await this.supabase!.saveAnswers(userId, answers);
    if (error) throw error;
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
        .map((profile) => ({
          ...profile,
          compatibility: this.applyDealbreakerCap(user?.dealbreakers ?? [], profile, profile.compatibility ?? 80)
        }))
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
        const baseCompatibility = Math.round(answerScore * 0.75 + interestScore * 0.25);
        const compatibility = this.applyDealbreakerCap(user.dealbreakers ?? [], profile, baseCompatibility);
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

  private applyDealbreakerCap(userDealbreakers: string[], profile: PublicProfile, compatibility: number): number {
    if (!this.hasDealbreakerConflict(userDealbreakers, profile.dealbreakers ?? [])) {
      return compatibility;
    }

    return Math.min(compatibility, 55);
  }

  private hasDealbreakerConflict(userDealbreakers: string[], profileDealbreakers: string[]): boolean {
    const normalizedUserDealbreakers = new Set(userDealbreakers.map((item) => this.normalize(item)));
    return profileDealbreakers.some((item) => normalizedUserDealbreakers.has(this.normalize(item)));
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private normalizeCategory(category: string): string {
    const normalized = this.normalize(category).replace(/\s+/g, '_');
    if (normalized.includes('vida')) return 'estilo_de_vida';
    return normalized || 'otros';
  }

  private hasDealbreakerOverlap(currentDealbreakers: string[], profileDealbreakers: string[]): boolean {
    const normalizedCurrent = new Set(currentDealbreakers.map((item) => this.normalize(item)));
    return profileDealbreakers.some((item) => normalizedCurrent.has(this.normalize(item)));
  }
}
