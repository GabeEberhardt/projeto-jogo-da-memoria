/* ========== Configuração ========== */

// Cada nível define: nome, quantidade de pares, colunas da grade e limite de tempo (segundos)
const LEVELS = {
  facil:   { label: "Fácil",   pairs: 3, cols: 3, limit: 60 },
  medio:   { label: "Médio",   pairs: 6, cols: 4, limit: 90 },
  dificil: { label: "Difícil", pairs: 8, cols: 4, limit: 100 }
};

// Cartas disponíveis: [valor, naipe]. Em cada partida sorteamos algumas delas.
const DECK = [
  ["A","♠"], ["K","♥"], ["Q","♦"], ["J","♣"], ["10","♠"],
  ["7","♥"], ["9","♦"], ["5","♣"], ["3","♠"], ["8","♥"]
];

// Atalho para buscar elementos pelo id
const $ = id => document.getElementById(id);

/* ========== Estado do jogo ========== */
let cfg;             // configuração do nível atual
let first = null;    // primeira carta virada na jogada (null se nenhuma)
let lock = false;    // true enquanto duas cartas erradas estão visíveis (impede novos cliques)
let found = 0;       // pares encontrados
let running = false; // true entre o clique em Iniciar e o fim da partida
let t0 = 0;          // momento em que a partida começou (ms)
let tick = null;     // id do setInterval do cronômetro

/* ========== Utilitários ========== */

// Converte segundos em "mm:ss"
const fmt = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

// Embaralha um array (algoritmo Fisher-Yates)
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ========== Estatísticas (localStorage) ========== */

// Lê as estatísticas salvas. O try/catch evita erro se o navegador bloquear o armazenamento.
function load() {
  try { return JSON.parse(localStorage.getItem("memoria-stats")) || {}; }
  catch (e) { return {}; }
}

function save(s) {
  try { localStorage.setItem("memoria-stats", JSON.stringify(s)); }
  catch (e) { /* sem armazenamento: o jogo continua funcionando, só não salva */ }
}

// Registra o resultado de uma partida: soma vitória/derrota e atualiza o melhor tempo
function record(key, won, secs) {
  const s = load();
  const r = s[key] || { w: 0, l: 0, best: null };
  if (won) {
    r.w++;
    if (r.best === null || secs < r.best) r.best = secs;
  } else {
    r.l++;
  }
  s[key] = r;
  save(s);
  renderStats();
}

// Desenha a tabela de estatísticas na página
function renderStats() {
  const s = load();
  $("rows").innerHTML = Object.entries(LEVELS).map(([k, v]) => {
    const r = s[k] || { w: 0, l: 0, best: null };
    return `<tr><td>${v.label}</td><td>${r.w}</td><td>${r.l}</td><td>${r.best === null ? "—" : fmt(r.best)}</td></tr>`;
  }).join("");
}

/* ========== Montagem do tabuleiro ========== */

// Prepara uma partida nova: reseta o estado e cria as cartas (ainda bloqueadas)
function build() {
  clearInterval(tick);
  running = false; first = null; lock = false; found = 0;

  cfg = LEVELS[$("level").value];

  // Sorteia os valores do nível, duplica (formando os pares) e embaralha
  const picks = shuffle(DECK.slice()).slice(0, cfg.pairs);
  const cards = shuffle(picks.concat(picks).map(([r, s]) => ({ r, s })));

  // Ajusta o número de colunas da grade e limpa as cartas anteriores
  const g = $("grid");
  g.style.gridTemplateColumns = `repeat(${cfg.cols}, 1fr)`;
  g.innerHTML = "";

  // Cria um botão para cada carta (botão = acessível pelo teclado)
  cards.forEach(c => {
    const b = document.createElement("button");
    b.className = "card off";                 // "off" bloqueia cliques até iniciar
    b.dataset.id = c.r + c.s;                 // identificador usado para comparar o par
    b.setAttribute("aria-label", "Carta virada para baixo");

    const red = c.s === "♥" || c.s === "♦";   // naipes vermelhos
    b.innerHTML =
      `<span class="back"></span>` +
      `<span class="face${red ? " r" : ""}">` +
        `<i class="a">${c.r}<br>${c.s}</i>${c.s}<i class="b">${c.r}<br>${c.s}</i>` +
      `</span>`;

    b.addEventListener("click", () => flip(b));
    g.appendChild(b);
  });

  $("timer").textContent = "00:00 / " + fmt(cfg.limit);
  $("start").textContent = "Iniciar";
  $("hint").textContent = "Escolha o nível e clique em Iniciar.";
}

/* ========== Fluxo do jogo ========== */

// Inicia (ou reinicia) a partida e liga o cronômetro
function start() {
  build();
  document.querySelectorAll(".card").forEach(c => c.classList.remove("off")); // libera os cliques
  running = true;
  t0 = Date.now();
  $("start").textContent = "Reiniciar";
  $("hint").textContent = "Encontre todos os pares antes do tempo acabar.";

  // A cada 250 ms atualiza o relógio; se passar do limite, o jogador perde
  tick = setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000);
    $("timer").textContent = fmt(s) + " / " + fmt(cfg.limit);
    if (s >= cfg.limit) end(false, s);
  }, 250);
}

// Chamada a cada clique em uma carta
function flip(b) {
  // Ignora cliques se: jogo parado, esperando cartas erradas desvirarem, ou carta já virada
  if (!running || lock || b.classList.contains("on")) return;

  b.classList.add("on"); // vira a carta

  // Primeira carta da jogada: só guarda e espera a segunda
  if (!first) { first = b; return; }

  // Segunda carta: compara com a primeira
  const a = first;
  first = null;
  lock = true; // bloqueia novos cliques até resolver esta jogada

  if (a.dataset.id === b.dataset.id) {
    // Acertou: as duas ficam visíveis e esmaecidas
    a.classList.add("done");
    b.classList.add("done");
    found++;
    lock = false;
    if (found === cfg.pairs) end(true, Math.floor((Date.now() - t0) / 1000)); // todos os pares: vitória
  } else {
    // Errou: mostra por 0,8 s e desvira as duas
    setTimeout(() => {
      a.classList.remove("on");
      b.classList.remove("on");
      lock = false;
    }, 800);
  }
}

// Encerra a partida (won = true para vitória), salva a estatística e mostra o diálogo
function end(won, secs) {
  clearInterval(tick);
  running = false;
  lock = true;
  record($("level").value, won, secs);

  $("dt").textContent = won ? "Parabéns!" : "Tempo esgotado";
  $("dm").textContent = won
    ? `Você terminou em ${fmt(secs)}.`
    : `Você encontrou ${found} de ${cfg.pairs} pares.`;
  $("dlg").showModal();
}

/* ========== Eventos e inicialização ========== */

$("start").addEventListener("click", start);
$("level").addEventListener("change", build);   // trocar o nível monta um novo tabuleiro
$("again").addEventListener("click", () => { $("dlg").close(); start(); });

build();        // monta o tabuleiro inicial (bloqueado)
renderStats();  // mostra as estatísticas salvas