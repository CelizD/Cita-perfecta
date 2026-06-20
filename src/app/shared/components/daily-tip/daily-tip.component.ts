import { ChangeDetectionStrategy, Component, computed } from '@angular/core';

@Component({
  selector: 'app-daily-tip',
  standalone: true,
  template: `
    <aside class="daily-tip">
      <span class="tip-emoji">{{ tip().emoji }}</span>
      <div>
        <small>Tip del dia</small>
        <p>{{ tip().text }}</p>
      </div>
    </aside>
  `,
  styles: [
    `
      .daily-tip {
        align-items: flex-start;
        background: linear-gradient(135deg, #fff5f7, #fff);
        border: 1px solid #ffd8e1;
        border-left: 4px solid #ff5c80;
        border-radius: 14px;
        color: #46314f;
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 1rem;
      }

      .tip-emoji {
        font-size: 2rem;
        line-height: 1;
      }

      small {
        color: #c93363;
        font-weight: 900;
        text-transform: uppercase;
      }

      p {
        margin: 0.2rem 0 0;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyTipComponent {
  private tips = [
    { emoji: '♡', text: 'Una carta bien escrita vale mas que diez likes vacios.' },
    { emoji: '✎', text: 'Responder con detalle mejora tus recomendaciones de compatibilidad.' },
    { emoji: '◦', text: 'Tomar un descanso de la app tambien es cuidarte.' },
    { emoji: '…', text: 'Los mensajes personalizados suelen recibir mejores respuestas.' },
    { emoji: '✦', text: 'Las conexiones reales crecen con paciencia y autenticidad.' }
  ];

  tip = computed(() => this.tips[new Date().getDate() % this.tips.length]);
}
