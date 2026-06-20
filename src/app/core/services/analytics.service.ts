import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

type AnalyticsPayload = Record<string, unknown>;

interface PostHogLike {
  init?: (key: string, options: Record<string, unknown>) => void;
  capture?: (event: string, properties?: AnalyticsPayload) => void;
  identify?: (userId: string, traits?: AnalyticsPayload) => void;
  reset?: () => void;
}

declare global {
  interface Window {
    posthog?: PostHogLike;
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private initialized = false;

  constructor() {
    const key = environment.posthog?.key;
    if (environment.production && key && key !== 'TU_POSTHOG_KEY' && window.posthog?.init) {
      window.posthog.init(key, {
        api_host: environment.posthog.host || 'https://app.posthog.com',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true
      });
      this.initialized = true;
    }
  }

  trackEvent(event: string, properties?: AnalyticsPayload): void {
    if (this.initialized) {
      window.posthog?.capture?.(event, properties);
    }
  }

  identifyUser(userId: string, traits?: AnalyticsPayload): void {
    if (this.initialized) {
      window.posthog?.identify?.(userId, traits);
    }
  }

  resetUser(): void {
    if (this.initialized) {
      window.posthog?.reset?.();
    }
  }

  trackOnboardingStep(step: number): void {
    this.trackEvent('onboarding_step', { step });
  }

  trackOnboardingComplete(): void {
    this.trackEvent('onboarding_complete');
  }

  trackLikeSent(targetUserId: string): void {
    this.trackEvent('like_sent', { target_user_id: targetUserId });
  }

  trackMatchCreated(matchId: string): void {
    this.trackEvent('match_created', { match_id: matchId });
  }

  trackMessageSent(chatId: string): void {
    this.trackEvent('message_sent', { chat_id: chatId });
  }

  trackPremiumPurchase(plan: string): void {
    this.trackEvent('premium_purchase', { plan });
  }

  trackReportSubmitted(reportedUserId: string): void {
    this.trackEvent('report_submitted', { reported_user_id: reportedUserId });
  }
}
