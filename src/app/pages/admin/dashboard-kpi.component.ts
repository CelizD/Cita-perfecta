import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '@core/services/supabase.service';

interface KpiMetric {
  label: string;
  value: number;
  trend: number;
  suffix?: string;
}

@Component({
  selector: 'app-dashboard-kpi',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-wide kpi-page">
      <div class="section-title">
        <span class="eyebrow">Admin</span>
        <h1>Dashboard de KPIs</h1>
        <p>Metricas principales para evaluar activacion, conexion y retencion.</p>
      </div>

      @if (errorMessage()) {
        <div class="alert error">{{ errorMessage() }}</div>
      }

      <div class="kpi-grid">
        @for (metric of metrics(); track metric.label) {
          <article class="kpi-card">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}{{ metric.suffix ?? '' }}</strong>
            <small [class.positive]="metric.trend >= 0" [class.negative]="metric.trend < 0">
              {{ metric.trend >= 0 ? '+' : '' }}{{ metric.trend }}%
            </small>
          </article>
        }
      </div>

      <div class="chart-grid">
        <article class="chart-card">
          <h2>Retencion estimada</h2>
          @for (item of retentionBars; track item.label) {
            <div class="bar-row">
              <span>{{ item.label }}</span>
              <div><i [style.width.%]="item.value"></i></div>
              <strong>{{ item.value }}%</strong>
            </div>
          }
        </article>

        <article class="chart-card">
          <h2>Acciones clave</h2>
          <p>Revisa semanalmente onboarding completado, primeros mensajes, reportes y conversion premium.</p>
          <a class="btn primary" routerLink="/dashboard">Volver al dashboard</a>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .kpi-page {
        padding-bottom: 3rem;
      }

      .kpi-grid,
      .chart-grid {
        display: grid;
        gap: 1rem;
      }

      .kpi-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .chart-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 1rem;
      }

      .kpi-card,
      .chart-card {
        background: #fff;
        border: 1px solid #ffd8e1;
        border-radius: 16px;
        box-shadow: 0 18px 45px rgba(255, 92, 128, 0.1);
        padding: 1.1rem;
      }

      .kpi-card {
        display: grid;
        gap: 0.45rem;
      }

      .kpi-card span {
        color: #755c7d;
        font-weight: 800;
      }

      .kpi-card strong {
        color: #241229;
        font-size: 2rem;
      }

      .positive {
        color: #008f5a;
      }

      .negative {
        color: #c93333;
      }

      .bar-row {
        align-items: center;
        display: grid;
        gap: 0.75rem;
        grid-template-columns: 72px 1fr 48px;
        margin-top: 0.8rem;
      }

      .bar-row div {
        background: #fff1f5;
        border-radius: 999px;
        height: 12px;
        overflow: hidden;
      }

      .bar-row i {
        background: linear-gradient(90deg, #ff5c80, #8157e5);
        display: block;
        height: 100%;
      }

      @media (max-width: 900px) {
        .kpi-grid,
        .chart-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardKPIComponent implements OnInit {
  private supabaseService = inject(SupabaseService);

  metrics = signal<KpiMetric[]>([]);
  errorMessage = signal('');
  retentionBars = [
    { label: 'D1', value: 65 },
    { label: 'D7', value: 32 },
    { label: 'D30', value: 18 }
  ];

  async ngOnInit(): Promise<void> {
    try {
      const metrics = await this.getKPIs();
      this.metrics.set(metrics);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'No se pudieron cargar los KPIs.');
    }
  }

  private async getKPIs(): Promise<KpiMetric[]> {
    const supabase = this.supabaseService.client;
    if (!supabase) throw new Error(this.supabaseService.requiredConfigMessage);

    const [users, onboarded, matches, messages, letters, premium] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_onboarded', true),
      supabase.from('matches').select('id', { count: 'exact', head: true }),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
      supabase.from('connection_letters').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('premium', true)
    ]);

    const userCount = users.count ?? 0;
    const premiumCount = premium.count ?? 0;

    return [
      { label: 'Usuarios', value: userCount, trend: 12 },
      { label: 'Onboarding', value: onboarded.count ?? 0, trend: 5 },
      { label: 'Matches', value: matches.count ?? 0, trend: 15 },
      { label: 'Mensajes', value: messages.count ?? 0, trend: 8 },
      { label: 'Cartas', value: letters.count ?? 0, trend: 6 },
      {
        label: 'Premium',
        value: userCount ? Math.round((premiumCount / userCount) * 100) : 0,
        suffix: '%',
        trend: 3
      }
    ];
  }
}
