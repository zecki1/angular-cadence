import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Jogo {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class HomePage {
  readonly jogos: Jogo[] = [
    { id: 'memoria', nome: 'Memória', descricao: 'Encontre os pares de objetos.', icone: '🧠', cor: '#6366f1' },
    { id: 'reacao', nome: 'Reação', descricao: 'Clique assim que ficar verde.', icone: '⚡', cor: '#22c55e' },
    { id: 'simon', nome: 'Simon Says', descricao: 'Repita a sequência de cores.', icone: '🎨', cor: '#f59e0b' },
    { id: 'pegar', nome: 'Pegar Objetos', descricao: 'Clique nos objetos que caem.', icone: '🎯', cor: '#ec4899' },
  ];
}
