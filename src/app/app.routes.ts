import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { JogoPage } from './pages/jogo/jogo';
import { RankingPage } from './pages/ranking/ranking';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Cadence — Minigames' },
  { path: 'jogo/:id', component: JogoPage, title: 'Jogo — Cadence' },
  { path: 'ranking', component: RankingPage, title: 'Ranking — Cadence' },
  { path: '**', redirectTo: '' },
];
