import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase';

export interface Pontuacao {
  jogador: string;
  jogo: string;
  pontos: number;
  criadoEm: string;
}

const CHAVE_LOCAL = 'cadence-scores';

@Injectable({ providedIn: 'root' })
export class ScoreService {
  private readonly supabase = inject(SupabaseService);
  readonly salvando = signal(false);

  async salvar(jogo: string, pontos: number, jogador = 'anon'): Promise<void> {
    this.salvando.set(true);
    try {
      if (this.supabase.cliente) {
        await this.supabase.cliente.from('cadence_scores').insert({
          jogador,
          jogo,
          pontos,
          created_at: new Date().toISOString(),
        });
      } else {
        const lista = this.lerLocal();
        lista.push({ jogador, jogo, pontos, criadoEm: new Date().toISOString() });
        localStorage.setItem(CHAVE_LOCAL, JSON.stringify(lista));
      }
    } catch {
      // silencioso: demo mode ou rede
    } finally {
      this.salvando.set(false);
    }
  }

  async ranking(jogo?: string, limite = 10): Promise<Pontuacao[]> {
    try {
      if (this.supabase.cliente) {
        let q = this.supabase.cliente
          .from('cadence_scores')
          .select('jogador,jogo,pontos,created_at')
          .order('pontos', { ascending: false })
          .limit(limite);
        if (jogo) q = q.eq('jogo', jogo);
        const { data, error } = await q;
        if (error || !data) return this.rankingLocal(jogo, limite);
        return data.map((r: { jogador: string; jogo: string; pontos: number; created_at: string }) => ({
          jogador: r.jogador,
          jogo: r.jogo,
          pontos: r.pontos,
          criadoEm: r.created_at,
        }));
      }
    } catch {
      // fallback
    }
    return this.rankingLocal(jogo, limite);
  }

  private lerLocal(): Pontuacao[] {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_LOCAL) || '[]');
    } catch {
      return [];
    }
  }

  private rankingLocal(jogo?: string, limite = 10): Pontuacao[] {
    let lista = this.lerLocal();
    if (jogo) lista = lista.filter((p) => p.jogo === jogo);
    return lista.sort((a, b) => b.pontos - a.pontos).slice(0, limite);
  }
}
