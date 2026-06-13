import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompatibilityService } from '../../core/services/compatibility.service';

@Component({
  selector: 'app-aura',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './aura.component.html',
  styleUrl: './aura.component.scss'
})
export class AuraComponent {
  private compatibilityService = inject(CompatibilityService);

  aura = this.compatibilityService.getAura();
}

