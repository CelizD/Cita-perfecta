import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-friendly-closure',
  standalone: true,
  imports: [],
  templateUrl: './friendly-closure.component.html',
  styleUrl: './friendly-closure.component.scss'
})
export class FriendlyClosureComponent {
  @Output() closeSelected = new EventEmitter<string>();

  options = [
    'Gracias por conversar conmigo. Creo que no somos compatibles, pero te deseo lo mejor.',
    'Me gustó conocerte, pero prefiero no continuar la conversación.',
    'Estoy tomando una pausa y prefiero cerrar esta conversación con respeto.'
  ];
}
