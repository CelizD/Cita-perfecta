import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="empty-state">
      <div class="empty-icon" aria-hidden="true">{{ icon }}</div>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>

      @if (actionText && actionLink) {
        <a class="btn primary" [routerLink]="actionLink">{{ actionText }}</a>
      } @else if (actionText) {
        <button class="btn primary" type="button" (click)="action.emit()">{{ actionText }}</button>
      }
    </div>
  `,
  styles: [
    `
      .empty-state {
        animation: fadeIn 0.25s ease;
        background: #fff;
        border: 1px solid #ffd8e1;
        border-radius: 16px;
        box-shadow: 0 18px 45px rgba(255, 92, 128, 0.1);
        color: #5f4a67;
        display: grid;
        gap: 0.75rem;
        justify-items: center;
        padding: 2rem;
        text-align: center;
      }

      .empty-icon {
        align-items: center;
        background: linear-gradient(135deg, #ff5c80, #8157e5);
        border-radius: 24px;
        color: #fff;
        display: flex;
        font-size: 2.4rem;
        font-weight: 900;
        height: 82px;
        justify-content: center;
        width: 82px;
      }

      h3,
      p {
        margin: 0;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() icon = 'CP';
  @Input() title = 'No hay nada aqui';
  @Input() description = 'Vuelve mas tarde.';
  @Input() actionText = '';
  @Input() actionLink: string | unknown[] | null = null;
  @Output() action = new EventEmitter<void>();
}
