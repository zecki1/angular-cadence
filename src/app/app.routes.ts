import { Routes } from '@angular/router';
import { PlaygroundPage } from './pages/playground/playground';
import { ComponentesPage } from './pages/componentes/componentes';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'playground' },
  { path: 'playground', component: PlaygroundPage, title: 'Playground — Cadence' },
  { path: 'componentes', component: ComponentesPage, title: 'Componentes — Cadence' },
  { path: '**', redirectTo: 'playground' },
];
