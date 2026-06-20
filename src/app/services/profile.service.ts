import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ExploreProfile {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  city: string | null;
  main_photo_url: string | null;
  main_photo_path?: string | null;
  bio: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private supabase = inject(SupabaseService);

  async getExploreProfiles(userId: string, page = 0, pageSize = 20): Promise<ExploreProfile[]> {
    const [blocksResponse, swipesResponse] = await Promise.all([
      this.supabase.getBlocksForUser(userId),
      this.supabase.getSwipesFromUser(userId)
    ]);

    if (blocksResponse.error) throw new Error(blocksResponse.error.message);
    if (swipesResponse.error) throw new Error(swipesResponse.error.message);

    const excludedUserIds = new Set<string>([userId]);

    for (const block of (blocksResponse.data ?? []) as Array<Record<string, string>>) {
      excludedUserIds.add(block['blocker_id']);
      excludedUserIds.add(block['blocked_user_id']);
    }

    for (const swipe of (swipesResponse.data ?? []) as Array<Record<string, string>>) {
      excludedUserIds.add(swipe['to_user_id']);
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;
    const response = await this.supabase.getExploreProfiles([...excludedUserIds], from, to);

    if (response.error) throw new Error(response.error.message);
    return (response.data ?? []) as unknown as ExploreProfile[];
  }
}
