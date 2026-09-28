import { Routes } from '@angular/router';
import playground from './pages/playground';
import componentes from './pages/componentes';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'playground' },
  { path: 'playground', component: playground, title: 'Playground — Cadence' },
  { path: 'componentes', component: componentes, title: 'Componentes — Cadence' },
  { path: '**', redirectTo: 'playground' },
];
