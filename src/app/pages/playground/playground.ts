import { Component, inject, signal } from '@angular/core';
import { SupabaseService } from '../../core/supabase';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.html',
  styleUrl: './playground.css',
})
export class PlaygroundPage {
  private readonly supabase = inject(SupabaseService);

  readonly titulo = 'Playground';
  protected readonly descricao = 'Switch de tamanho, estado, icone e theme.';
  protected readonly slugProjeto = 'cadence';

  protected readonly conectando = signal(false);
  protected readonly conexaoOk = signal<boolean | null>(null);

  /** Health-check contra o projeto Supabase compartilhado. */
  protected async verificar(): Promise<void> {
    this.conectando.set(true);
    this.conexaoOk.set(await this.supabase.verificarConexão());
    this.conectando.set(false);
  }
}
