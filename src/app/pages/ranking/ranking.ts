import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScoreService, Pontuacao } from '../../core/score.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: 'app-ranking',
  styleUrl: './ranking.css',
  templateUrl: './ranking.html',
})
export class RankingPage {
  private readonly scores = inject(ScoreService);
  readonly lista = signal<Pontuacao[]>([]);
  readonly carregando = signal(true);

  constructor() {
    this.scores.ranking().then((r) => {
      this.lista.set(r);
      this.carregando.set(false);
    });
  }
}
