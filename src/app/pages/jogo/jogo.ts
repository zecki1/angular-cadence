import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ScoreService } from '../../core/score.service';

interface CartaMemoria {
  id: number;
  emoji: string;
  virada: boolean;
  combinada: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: 'app-jogo',
  styleUrl: './jogo.css',
  templateUrl: './jogo.html',
})
export class JogoPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly scores = inject(ScoreService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = signal<string>(this.route.snapshot.paramMap.get('id') ?? 'memoria');

  // ---- Memória ----
  readonly emojis = ['🎯', '⚡', '🎨', '🧠', '🔥', '💎', '🚀', '🌟'];
  readonly cartas = signal<CartaMemoria[]>(this.montarCartas());
  readonly viradas = signal<number[]>([]);
  readonly movimentos = signal(0);
  readonly paresFeitos = signal(0);
  readonly memoriaFim = signal(false);
  readonly memoriaInicio = signal<number | null>(null);
  readonly tempoMemoria = signal(0);
  private timerMemoria: ReturnType<typeof setInterval> | null = null;

  // ---- Reação ----
  readonly reacaoEstado = signal<'espera' | 'pronto' | 'verde' | 'cedo' | 'fim'>('espera');
  readonly reacaoTempos = signal<number[]>([]);
  readonly reacaoRodada = signal(0);
  readonly reacaoInicio = signal(0);
  private timerReacao: ReturnType<typeof setTimeout> | null = null;

  // ---- Simon ----
  readonly simonSequencia = signal<number[]>([]);
  readonly simonJogador = signal<number[]>([]);
  readonly simonNivel = signal(0);
  readonly simonEstado = signal<'idle' | 'mostrando' | 'jogando' | 'fim'>('idle');
  readonly simonCores = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b'];
  private simonTimer: ReturnType<typeof setTimeout> | null = null;

  // ---- Pegar objetos ----
  readonly pegarPontos = signal(0);
  readonly pegarVidas = signal(3);
  readonly pegarTempo = signal(30);
  readonly pegarAtivo = signal(false);
  readonly pegarObjetos = signal<{ id: number; x: number; y: number; emoji: string }[]>([]);
  private pegarInterval: ReturnType<typeof setInterval> | null = null;
  private pegarSpawn: ReturnType<typeof setInterval> | null = null;
  private pegarTick: ReturnType<typeof setInterval> | null = null;
  private pegarId = 0;

  constructor() {
    this.destroyRef.onDestroy(() => this.limparTimers());
    this.route.paramMap.subscribe((p) => {
      const novo = p.get('id') ?? 'memoria';
      this.id.set(novo);
      this.reiniciar(novo);
    });
  }

  voltar(): void {
    this.limparTimers();
    this.router.navigate(['/']);
  }

  // ---------- Memória ----------
  montarCartas(): CartaMemoria[] {
    const pares = this.emojis.flatMap((e, i) => [
      { id: i * 2, emoji: e, virada: false, combinada: false },
      { id: i * 2 + 1, emoji: e, virada: false, combinada: false },
    ]);
    // shuffle
    for (let i = pares.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pares[i], pares[j]] = [pares[j], pares[i]];
    }
    return pares;
  }

  virarCarta(carta: CartaMemoria): void {
    if (carta.combinada || carta.virada) return;
    if (this.viradas().length >= 2) return;
    const cartas = this.cartas().map((c) => (c.id === carta.id ? { ...c, virada: true } : c));
    this.cartas.set(cartas);
    const v = [...this.viradas(), carta.id];
    this.viradas.set(v);
    if (this.memoriaInicio() === null) {
      this.memoriaInicio.set(Date.now());
      this.timerMemoria = setInterval(() => {
        const ini = this.memoriaInicio();
        if (ini) this.tempoMemoria.set(Math.floor((Date.now() - ini) / 1000));
      }, 1000);
    }
    if (v.length === 2) {
      this.movimentos.update((m) => m + 1);
      const [a, b] = v.map((id) => cartas.find((c) => c.id === id)!);
      if (a.emoji === b.emoji) {
        const novas = this.cartas().map((c) =>
          c.id === a.id || c.id === b.id ? { ...c, combinada: true } : c,
        );
        this.cartas.set(novas);
        this.viradas.set([]);
        this.paresFeitos.update((p) => p + 1);
        if (this.paresFeitos() === this.emojis.length) {
          this.memoriaFim.set(true);
          if (this.timerMemoria) clearInterval(this.timerMemoria);
          const tempo = this.tempoMemoria();
          const pontos = Math.max(100, 1000 - this.movimentos() * 10 - tempo * 5);
          this.scores.salvar('memoria', pontos);
        }
      } else {
        setTimeout(() => {
          const novas = this.cartas().map((c) =>
            v.includes(c.id) && !c.combinada ? { ...c, virada: false } : c,
          );
          this.cartas.set(novas);
          this.viradas.set([]);
        }, 900);
      }
    }
  }

  reiniciarMemoria(): void {
    this.limparTimers();
    this.cartas.set(this.montarCartas());
    this.viradas.set([]);
    this.movimentos.set(0);
    this.paresFeitos.set(0);
    this.memoriaFim.set(false);
    this.memoriaInicio.set(null);
    this.tempoMemoria.set(0);
  }

  // ---------- Reação ----------
  iniciarReacao(): void {
    this.reacaoTempos.set([]);
    this.reacaoRodada.set(0);
    this.proximaRodadaReacao();
  }

  proximaRodadaReacao(): void {
    if (this.reacaoRodada() >= 5) {
      this.reacaoEstado.set('fim');
      const media = this.reacaoTempos().reduce((a, b) => a + b, 0) / this.reacaoTempos().length;
      this.scores.salvar('reacao', Math.round(1000 - media));
      return;
    }
    this.reacaoEstado.set('pronto');
    this.reacaoRodada.update((r) => r + 1);
    const atraso = 1500 + Math.random() * 3000;
    this.timerReacao = setTimeout(() => {
      this.reacaoEstado.set('verde');
      this.reacaoInicio.set(performance.now());
    }, atraso);
  }

  clicarReacao(): void {
    if (this.reacaoEstado() === 'pronto') {
      if (this.timerReacao) clearTimeout(this.timerReacao);
      this.reacaoEstado.set('cedo');
      setTimeout(() => this.proximaRodadaReacao(), 1200);
      return;
    }
    if (this.reacaoEstado() === 'verde') {
      const tempo = Math.round(performance.now() - this.reacaoInicio());
      this.reacaoTempos.update((t) => [...t, tempo]);
      this.reacaoEstado.set('pronto');
      setTimeout(() => this.proximaRodadaReacao(), 900);
    }
  }

  mediaReacao(): number {
    const t = this.reacaoTempos();
    if (!t.length) return 0;
    return Math.round(t.reduce((a, b) => a + b, 0) / t.length);
  }

  // ---------- Simon ----------
  iniciarSimon(): void {
    this.simonSequencia.set([]);
    this.simonJogador.set([]);
    this.simonNivel.set(0);
    this.simonEstado.set('idle');
    setTimeout(() => this.proximoNivelSimon(), 600);
  }

  proximoNivelSimon(): void {
    const seq = [...this.simonSequencia(), Math.floor(Math.random() * 4)];
    this.simonSequencia.set(seq);
    this.simonJogador.set([]);
    this.simonNivel.set(seq.length);
    this.simonEstado.set('mostrando');
    this.mostrarSequenciaSimon(0);
  }

  mostrarSequenciaSimon(i: number): void {
    if (i >= this.simonSequencia().length) {
      this.simonEstado.set('jogando');
      return;
    }
    const cor = this.simonSequencia()[i];
    this.simonAtivo.set(cor);
    this.simonTimer = setTimeout(() => {
      this.simonAtivo.set(-1);
      this.simonTimer = setTimeout(() => this.mostrarSequenciaSimon(i + 1), 350);
    }, 600);
  }

  readonly simonAtivo = signal(-1);

  jogarSimon(cor: number): void {
    if (this.simonEstado() !== 'jogando') return;
    const jog = [...this.simonJogador(), cor];
    this.simonJogador.set(jog);
    const seq = this.simonSequencia();
    if (jog[jog.length - 1] !== seq[jog.length - 1]) {
      this.simonEstado.set('fim');
      this.scores.salvar('simon', this.simonNivel() * 10);
      return;
    }
    if (jog.length === seq.length) {
      setTimeout(() => this.proximoNivelSimon(), 700);
    }
  }

  // ---------- Pegar objetos ----------
  iniciarPegar(): void {
    this.pegarPontos.set(0);
    this.pegarVidas.set(3);
    this.pegarTempo.set(30);
    this.pegarObjetos.set([]);
    this.pegarAtivo.set(true);
    this.pegarSpawn = setInterval(() => {
      const emojis = ['💎', '⭐', '🔥', '🎯', '💰'];
      const obj = { id: this.pegarId++, x: Math.random() * 80 + 10, y: -5, emoji: emojis[Math.floor(Math.random() * emojis.length)] };
      this.pegarObjetos.update((o) => [...o, obj]);
    }, 700);
    this.pegarTick = setInterval(() => {
      this.pegarObjetos.update((objs) =>
        objs
          .map((o) => ({ ...o, y: o.y + 2 }))
          .filter((o) => {
            if (o.y > 95) {
              this.pegarVidas.update((v) => v - 1);
              if (this.pegarVidas() <= 0) this.fimPegar();
              return false;
            }
            return true;
          }),
      );
    }, 60);
    this.pegarInterval = setInterval(() => {
      this.pegarTempo.update((t) => {
        if (t <= 1) {
          this.fimPegar();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  clicarObjeto(id: number): void {
    this.pegarObjetos.update((objs) => objs.filter((o) => o.id !== id));
    this.pegarPontos.update((p) => p + 10);
  }

  fimPegar(): void {
    this.limparTimers();
    this.pegarAtivo.set(false);
    this.scores.salvar('pegar', this.pegarPontos());
  }

  reiniciar(id: string): void {
    this.limparTimers();
    // reset all
    this.reiniciarMemoria();
    this.reacaoEstado.set('espera');
    this.reacaoTempos.set([]);
    this.reacaoRodada.set(0);
    this.simonSequencia.set([]);
    this.simonJogador.set([]);
    this.simonNivel.set(0);
    this.simonEstado.set('idle');
    this.simonAtivo.set(-1);
    this.pegarPontos.set(0);
    this.pegarVidas.set(3);
    this.pegarTempo.set(30);
    this.pegarAtivo.set(false);
    this.pegarObjetos.set([]);
  }

  private limparTimers(): void {
    if (this.timerMemoria) { clearInterval(this.timerMemoria); this.timerMemoria = null; }
    if (this.timerReacao) { clearTimeout(this.timerReacao); this.timerReacao = null; }
    if (this.simonTimer) { clearTimeout(this.simonTimer); this.simonTimer = null; }
    if (this.pegarInterval) { clearInterval(this.pegarInterval); this.pegarInterval = null; }
    if (this.pegarSpawn) { clearInterval(this.pegarSpawn); this.pegarSpawn = null; }
    if (this.pegarTick) { clearInterval(this.pegarTick); this.pegarTick = null; }
  }

  nomeJogo(): string {
    const map: Record<string, string> = {
      memoria: 'Memória',
      reacao: 'Reação',
      simon: 'Simon Says',
      pegar: 'Pegar Objetos',
    };
    return map[this.id()] ?? this.id();
  }
}
