import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ScoreService } from '../../core/score.service';

interface CartaMemoria {
  id: number;
  emoji: string;
  virada: boolean;
  combinada: boolean;
}

interface PecaDama {
  cor: 'branco' | 'preto';
  dama: boolean;
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

  // ---- Jogo da Velha ----
  readonly velhaTabuleiro = signal<(null | 'X' | 'O')[]>(Array(9).fill(null));
  readonly velhaVez = signal<'X' | 'O'>('X');
  readonly velhaVencedor = signal<null | 'X' | 'O' | 'empate'>(null);
  readonly velhaLinha = signal<number[] | null>(null);
  readonly velhaPlacar = signal<{ X: number; O: number; empate: number }>({ X: 0, O: 0, empate: 0 });
  readonly velhaModo = signal<'cpu' | 'dois'>('cpu');
  readonly velhaPensando = signal(false);
  private velhaTimer: ReturnType<typeof setTimeout> | null = null;

  // ---- Dama ----
  readonly damaTabuleiro = signal<(PecaDama | null)[][]>(this.montarDama());
  readonly damaVez = signal<'branco' | 'preto'>('branco');
  readonly damaSelecionada = signal<{ r: number; c: number } | null>(null);
  readonly damaVencedor = signal<null | 'branco' | 'preto'>(null);
  readonly damaCapturas = signal<{ branco: number; preto: number }>({ branco: 0, preto: 0 });

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
      this.reiniciar();
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

  // ---------- Jogo da Velha ----------
  jogarVelha(i: number): void {
    if (this.velhaTabuleiro()[i] || this.velhaVencedor() || this.velhaPensando()) return;
    if (this.velhaModo() === 'cpu' && this.velhaVez() === 'O') return;
    this.aplicarJogadaVelha(i, this.velhaVez());
    if (this.velhaModo() === 'cpu' && !this.velhaVencedor() && this.velhaVez() === 'O') {
      this.velhaPensando.set(true);
      this.velhaTimer = setTimeout(() => {
        this.velhaPensando.set(false);
        const melhor = this.melhorJogadaVelha([...this.velhaTabuleiro()], 'O');
        if (melhor >= 0) this.aplicarJogadaVelha(melhor, 'O');
      }, 420);
    }
  }

  private aplicarJogadaVelha(i: number, quem: 'X' | 'O'): void {
    const t = [...this.velhaTabuleiro()];
    t[i] = quem;
    this.velhaTabuleiro.set(t);
    const linha = this.linhaVencedora(t);
    if (linha) {
      this.velhaLinha.set(linha);
      this.velhaVencedor.set(quem);
      this.velhaPlacar.update((pl) => ({ ...pl, [quem]: pl[quem] + 1 }));
      this.scores.salvar('velha', 100);
      return;
    }
    if (t.every((x) => x)) {
      this.velhaVencedor.set('empate');
      this.velhaPlacar.update((pl) => ({ ...pl, empate: pl.empate + 1 }));
      return;
    }
    this.velhaVez.set(quem === 'X' ? 'O' : 'X');
  }

  private linhaVencedora(t: (null | 'X' | 'O')[]): number[] | null {
    const linhas = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of linhas) {
      if (t[a] && t[a] === t[b] && t[a] === t[c]) return [a, b, c];
    }
    return null;
  }

  calcularVencedorVelha(t: (null | 'X' | 'O')[]): null | 'X' | 'O' | 'empate' {
    const linha = this.linhaVencedora(t);
    if (linha) return t[linha[0]] as 'X' | 'O';
    if (t.every((x) => x)) return 'empate';
    return null;
  }

  private melhorJogadaVelha(t: (null | 'X' | 'O')[], quem: 'X' | 'O'): number {
    let melhor = -Infinity;
    let candidatos: number[] = [];
    for (let i = 0; i < 9; i++) {
      if (t[i]) continue;
      t[i] = quem;
      const pontos = this.minimaxVelha(t, quem === 'O' ? 'X' : 'O', 0);
      t[i] = null;
      if (pontos > melhor) {
        melhor = pontos;
        candidatos = [i];
      } else if (pontos === melhor) {
        candidatos.push(i);
      }
    }
    return candidatos[Math.floor(Math.random() * candidatos.length)] ?? -1;
  }

  private minimaxVelha(t: (null | 'X' | 'O')[], vez: 'X' | 'O', profundidade: number): number {
    const linha = this.linhaVencedora(t);
    if (linha) {
      return t[linha[0]] === 'O' ? 10 - profundidade : profundidade - 10;
    }
    if (t.every((x) => x)) return 0;
    if (vez === 'O') {
      let melhor = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (t[i]) continue;
        t[i] = 'O';
        melhor = Math.max(melhor, this.minimaxVelha(t, 'X', profundidade + 1));
        t[i] = null;
      }
      return melhor;
    }
    let melhor = Infinity;
    for (let i = 0; i < 9; i++) {
      if (t[i]) continue;
      t[i] = 'X';
      melhor = Math.min(melhor, this.minimaxVelha(t, 'O', profundidade + 1));
      t[i] = null;
    }
    return melhor;
  }

  definirModoVelha(modo: 'cpu' | 'dois'): void {
    if (this.velhaModo() === modo) return;
    this.velhaModo.set(modo);
    this.reiniciarVelha();
  }

  reiniciarVelha(): void {
    if (this.velhaTimer) {
      clearTimeout(this.velhaTimer);
      this.velhaTimer = null;
    }
    this.velhaPensando.set(false);
    this.velhaTabuleiro.set(Array(9).fill(null));
    this.velhaVez.set('X');
    this.velhaVencedor.set(null);
    this.velhaLinha.set(null);
  }

  // ---------- Dama ----------
  montarDama(): (PecaDama | null)[][] {
    const board: (PecaDama | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) board[r][c] = { cor: 'preto', dama: false };
      }
    }
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) board[r][c] = { cor: 'branco', dama: false };
      }
    }
    return board;
  }

  selecionarDama(r: number, c: number): void {
    if (this.damaVencedor()) return;
    const peca = this.damaTabuleiro()[r][c];
    const sel = this.damaSelecionada();
    if (sel) {
      if (this.tentarMoverDama(sel.r, sel.c, r, c)) {
        this.damaSelecionada.set(null);
        return;
      }
      if (peca && peca.cor === this.damaVez()) {
        this.damaSelecionada.set({ r, c });
      } else {
        this.damaSelecionada.set(null);
      }
      return;
    }
    if (peca && peca.cor === this.damaVez()) {
      this.damaSelecionada.set({ r, c });
    }
  }

  tentarMoverDama(fr: number, fc: number, tr: number, tc: number): boolean {
    const board = this.damaTabuleiro().map((row) => [...row]);
    const peca = board[fr][fc];
    if (!peca) return false;
    const dr = tr - fr;
    const dc = tc - fc;
    const dir = peca.cor === 'branco' ? -1 : 1;
    // movimento simples
    if (Math.abs(dr) === 1 && Math.abs(dc) === 1 && (peca.dama || dr === dir)) {
      if (board[tr][tc] === null) {
        board[tr][tc] = peca;
        board[fr][fc] = null;
        this.promoverDama(board, tr, tc);
        this.damaTabuleiro.set(board);
        this.trocarVezDama();
        return true;
      }
    }
    // captura
    if (Math.abs(dr) === 2 && Math.abs(dc) === 2 && (peca.dama || dr === dir * 2)) {
      const mr = (fr + tr) / 2;
      const mc = (fc + tc) / 2;
      const meio = board[mr][mc];
      if (meio && meio.cor !== peca.cor && board[tr][tc] === null) {
        board[tr][tc] = peca;
        board[fr][fc] = null;
        board[mr][mc] = null;
        this.promoverDama(board, tr, tc);
        this.damaTabuleiro.set(board);
        const cap = { ...this.damaCapturas() };
        if (peca.cor === 'branco') cap.preto++;
        else cap.branco++;
        this.damaCapturas.set(cap);
        this.trocarVezDama();
        return true;
      }
    }
    return false;
  }

  promoverDama(board: (PecaDama | null)[][], r: number, c: number): void {
    const p = board[r][c];
    if (!p) return;
    if (p.cor === 'branco' && r === 0) p.dama = true;
    if (p.cor === 'preto' && r === 7) p.dama = true;
  }

  trocarVezDama(): void {
    this.damaVez.set(this.damaVez() === 'branco' ? 'preto' : 'branco');
    this.verificarVencedorDama();
  }

  verificarVencedorDama(): void {
    let b = 0, p = 0;
    for (const row of this.damaTabuleiro()) for (const cell of row) {
      if (cell?.cor === 'branco') b++;
      if (cell?.cor === 'preto') p++;
    }
    if (b === 0) this.damaVencedor.set('preto');
    else if (p === 0) this.damaVencedor.set('branco');
  }

  reiniciarDama(): void {
    this.damaTabuleiro.set(this.montarDama());
    this.damaVez.set('branco');
    this.damaSelecionada.set(null);
    this.damaVencedor.set(null);
    this.damaCapturas.set({ branco: 0, preto: 0 });
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

  reiniciar(): void {
    this.limparTimers();
    this.reiniciarMemoria();
    this.reacaoEstado.set('espera');
    this.reacaoTempos.set([]);
    this.reacaoRodada.set(0);
    this.reiniciarVelha();
    this.reiniciarDama();
    this.pegarPontos.set(0);
    this.pegarVidas.set(3);
    this.pegarTempo.set(30);
    this.pegarAtivo.set(false);
    this.pegarObjetos.set([]);
  }

  private limparTimers(): void {
    if (this.timerMemoria) { clearInterval(this.timerMemoria); this.timerMemoria = null; }
    if (this.timerReacao) { clearTimeout(this.timerReacao); this.timerReacao = null; }
    if (this.velhaTimer) { clearTimeout(this.velhaTimer); this.velhaTimer = null; }
    if (this.pegarInterval) { clearInterval(this.pegarInterval); this.pegarInterval = null; }
    if (this.pegarSpawn) { clearInterval(this.pegarSpawn); this.pegarSpawn = null; }
    if (this.pegarTick) { clearInterval(this.pegarTick); this.pegarTick = null; }
  }

  nomeJogo(): string {
    const map: Record<string, string> = {
      memoria: 'Memória',
      reacao: 'Reação',
      velha: 'Jogo da Velha',
      dama: 'Dama',
      pegar: 'Pegar Objetos',
    };
    return map[this.id()] ?? this.id();
  }
}
