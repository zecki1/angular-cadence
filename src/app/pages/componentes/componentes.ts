import { Component, inject, signal } from '@angular/core';
import { SupabaseService } from '../../core/supabase';

@Component({
  selector: 'app-componentes',
  templateUrl: './componentes.html',
  styleUrl: './componentes.css',
})
export class ComponentesPage {
  private readonly supabase = inject(SupabaseService);

  readonly titulo = 'Componentes';
  protected readonly descricao = 'Button, Input, Badge, Modal, Toast, DatePicker, Tabs, Skeleton, Table, Progress.';
  protected readonly slugProjeto = 'cadence';

  protected readonly conectando = signal(false);
  protected readonly conexaoOk = signal<boolean | null>(null);
  protected readonly modoDemo = this.supabase.modoDemo;

  /** Health-check contra o projeto Supabase compartilhado. */
  protected async verificar(): Promise<void> {
    if (this.modoDemo()) {
      this.conexaoOk.set(false);
      return;
    }
    this.conectando.set(true);
    this.conexaoOk.set(await this.supabase.verificarConexão());
    this.conectando.set(false);
  }
}
