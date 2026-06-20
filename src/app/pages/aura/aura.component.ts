import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompatibilityService } from '../../core/services/compatibility.service';

@Component({
  selector: 'app-aura',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './aura.component.html',
  styleUrl: './aura.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuraComponent {
  private compatibilityService = inject(CompatibilityService);

  aura = this.compatibilityService.getAura();
  userAura = signal(this.aura.title);
  auraConfigs: Record<string, { emoji: string; gradient: string; description: string; strengths: string[] }> = {
    'Romantico Profundo': {
      emoji: '♥',
      gradient: 'linear-gradient(135deg, #ff5c80, #c93363)',
      description: 'Creas conexiones intensas y significativas.',
      strengths: ['Empatia', 'Compromiso', 'Profundidad']
    },
    'Empatico Tranquilo': {
      emoji: '☘',
      gradient: 'linear-gradient(135deg, #8ee6c3, #2ecc71)',
      description: 'Tu calma ayuda a que otras personas se sientan seguras.',
      strengths: ['Escucha', 'Paciencia', 'Cuidado']
    },
    'Explorador Leal': {
      emoji: '◆',
      gradient: 'linear-gradient(135deg, #8157e5, #4834d4)',
      description: 'Buscas crecer, descubrir y construir con lealtad.',
      strengths: ['Curiosidad', 'Lealtad', 'Aventura']
    },
    'Comunicador Claro': {
      emoji: '•',
      gradient: 'linear-gradient(135deg, #2d9cdb, #1b75bb)',
      description: 'La honestidad y los acuerdos claros son tu base.',
      strengths: ['Claridad', 'Honestidad', 'Acuerdos']
    },
    Protector: {
      emoji: '◈',
      gradient: 'linear-gradient(135deg, #2d3436, #0984e3)',
      description: 'Tu fuerza esta en cuidar limites y crear confianza.',
      strengths: ['Seguridad', 'Responsabilidad', 'Confianza']
    }
  };

  auraConfig = computed(() => this.auraConfigs[this.userAura()] ?? this.auraConfigs['Empatico Tranquilo']);

  async shareAura(): Promise<void> {
    const config = this.auraConfig();
    const shareData = {
      title: 'Mi Aura en Cita Perfecta',
      text: `Soy ${this.userAura()} ${config.emoji}. ${config.description}`,
      url: window.location.href
    };

    if (navigator.share) {
      await navigator.share(shareData);
    }
  }
}
