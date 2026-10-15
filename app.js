/* Memory Duel: user interface. Game rules live in game.js. */
(function () {
  'use strict';

  const Core = window.MemoryCore;
  const YOU = 0;
  const AI = 1;
  const $ = (sel) => document.querySelector(sel);

  /* ---------------- Text ---------------- */
  const STRINGS = {
    en: {
      you: 'You',
      level_forget7: 'Amnesiac',
      level_forget6: 'Scatterbrained',
      level_forget5: 'Forgetful',
      level_forget4: 'Distracted',
      level_forget3: 'Inconsistent',
      level_forget2: 'Fallible',
      level_beginner: 'Mostly sharp',
      level_casual: 'Reckless',
      level_advanced: 'Careful',
      level_expert: 'Optimal',
      desc_forget7: 'Remembers nothing, so every card it flips is a guess.',
      desc_forget6: 'Forgets about six cards in seven and risks a second unknown card when stuck.',
      desc_forget5: 'Forgets about five cards in seven and risks a second unknown card when stuck.',
      desc_forget4: 'Forgets about four cards in seven and risks a second unknown card when stuck.',
      desc_forget3: 'Forgets about three cards in seven and risks a second unknown card when stuck.',
      desc_forget2: 'Forgets about two cards in seven and risks a second unknown card when stuck.',
      desc_beginner: 'Forgets about one card in seven and risks a second unknown card when stuck.',
      desc_casual: 'Remembers every card but still risks a second unknown card when stuck.',
      desc_advanced: 'Remembers every card and never risks a second unknown card.',
      desc_expert: 'Remembers every card and plays the calculated best move, passing when it pays.',
      yourTurn: 'Your turn. Flip a card.',
      secondCard: 'Flip a second card.',
      pairYou: 'Pair! Play again.',
      pairAi: '{name} found a pair.',
      aiTurn: '{name} is playing…',
      missAuto: 'No match.',
      missTap: 'No match. Tap the board to continue.',
      youPassed: 'You passed: both cards were already known.',
      aiPassed: '{name} passed by flipping two known cards.',
      gameOf: 'Game {n} of {total}',
      singleGame: 'Single game',
      seriesScore: 'Series {a}–{b}',
      newGame: 'New game',
      restart: 'Restart game',
      nextGame: 'Next game',
      newSeries: 'New series',
      settings: 'Settings',
      rules: 'Rules',
      close: 'Close',
      viewBoard: 'View board',
      resWin: 'You win',
      resLose: '{name} wins',
      resDraw: 'Draw',
      resCleared: 'You {a}, {name} {b}.',
      resTiebreakYou: '16–16, and you took the last pair.',
      resTiebreakAi: '16–16, and {name} took the last pair.',
      resStopped: 'Both players passed, so the game stopped at {a}–{b}.',
      resStoppedTieYou: 'Both players passed at {a}–{b}, and you took the last pair.',
      resStoppedTieAi: 'Both players passed at {a}–{b}, and {name} took the last pair.',
      resSeriesSoFar: 'Series {a}–{b} after {n} of {total} games.',
      resSeriesDone: 'Series finished {a}–{b}.',
      tip_missedPartner: 'Memory slip: the other {sym} was at {at}.',
      tip_gaveAway: 'Your second unknown card handed over the {sym} pair. After an unknown first card, flip a card you already know.',
      tip_risky2nd: 'Risky second card. An unknown card can hand your opponent a pair; a card you already knew was the safer choice.',
      tip_trap: 'Trap: {u} untouched pair{s} and {k} known singles. Flipping an unknown card here loses on average. Pass by flipping two cards you already know.',
      tip_needlessPass: 'No need to pass here. Flipping an unknown card was the better move.',
      tip_leftPairs: 'You left {n} known pair{s} on the table for your opponent. Collect every pair you know first.',
      sitKnown: 'Known singles',
      sitUntouched: 'Untouched pairs',
      sitTrap: 'Trap: pass by flipping two cards you already know.',
      setOpponent: 'Opponent',
      setRestartNote: 'Opponent and series changes start a new series with your next game.',
      setInOrder: 'Opponent explores in 2×2 blocks',
      setInOrderNote: 'Instead of flipping new cards at random, it explores block by block from a1 and finishes any block you start, like two players sharing the work.',
      setCoach: 'Coach tips',
      setCoachNote: 'Reviews your moves after each turn and shows the position counts. Turn it off for realistic practice.',
      setCoords: 'Show coordinates (a1–h8)',
      setPace: 'Opponent speed',
      paceSlow: 'Slow',
      paceNormal: 'Normal',
      paceFast: 'Fast',
      setAiShow: 'Opponent’s missed cards stay up',
      setMyMiss: 'Your missed cards stay up',
      untilTap: 'Until I tap',
      setSeries: 'Games per series',
      setLang: 'Language',
      langAuto: 'Match my device',
      record: 'Record',
      recordLine: '{w} won, {l} lost',
      resetRecord: 'Reset record',
      rulesTitle: 'Rules and strategy',
      a11yTaken: 'empty',
      a11yDown: 'face down',
      rulesHtml: `
<h3>How a game works</h3>
<p>Two players, 32 pairs laid out 8 × 8. On your turn, flip two cards. If they match, the pair is yours and you play again. If not, they go back face down and the turn passes.</p>
<p>When the board is cleared, most pairs wins. At 16–16, whoever took the last pair wins.</p>
<p>Flipping two cards that were both already known counts as passing. If both players pass in a row, the game stops there: the leader wins, and a tie goes to whoever took the last pair.</p>
<h3>How to win</h3>
<ol>
<li>Collect every pair you know before anything else.</li>
<li>Flip an unknown card. If you don’t know where its partner is, make your second card one you have already seen. A second unknown card often hands your opponent a pair.</li>
<li>Watch for traps. With exactly one untouched pair left and three or more known singles, flipping an unknown card usually gives the rest of the board away. Pass instead, as long as you are ahead (or tied after taking the last pair). Three or five untouched pairs with many known singles are traps too; two or four never are.</li>
</ol>
<p>A <em>known single</em> is a card you have seen whose partner you haven’t. An <em>untouched pair</em> is one where neither card has been seen. Coach tips count both for you and flag traps.</p>
<h3>Training</h3>
<p>Play full series. In a tournament the hard part is not mixing up this game’s cards with the previous game’s. Cards you flip are outlined in your color, the computer’s in its color.</p>
<p class="fine">These rules follow the usual German tournament format. Organizers can differ in details, such as exactly when a game counts as stuck, so check on the day.</p>`,
    },
    es: {
      you: 'Tú',
      level_forget7: 'Amnésico',
      level_forget6: 'Despistado',
      level_forget5: 'Olvidadizo',
      level_forget4: 'Distraído',
      level_forget3: 'Irregular',
      level_forget2: 'Falible',
      level_beginner: 'Casi infalible',
      level_casual: 'Temerario',
      level_advanced: 'Prudente',
      level_expert: 'Óptimo',
      desc_forget7: 'No recuerda nada, así que cada carta que da vuelta es al azar.',
      desc_forget6: 'Olvida más o menos seis de cada siete cartas y, cuando no sabe qué hacer, arriesga una segunda carta desconocida.',
      desc_forget5: 'Olvida más o menos cinco de cada siete cartas y, cuando no sabe qué hacer, arriesga una segunda carta desconocida.',
      desc_forget4: 'Olvida más o menos cuatro de cada siete cartas y, cuando no sabe qué hacer, arriesga una segunda carta desconocida.',
      desc_forget3: 'Olvida más o menos tres de cada siete cartas y, cuando no sabe qué hacer, arriesga una segunda carta desconocida.',
      desc_forget2: 'Olvida más o menos dos de cada siete cartas y, cuando no sabe qué hacer, arriesga una segunda carta desconocida.',
      desc_beginner: 'Olvida más o menos una de cada siete cartas y, cuando no sabe qué hacer, arriesga una segunda carta desconocida.',
      desc_casual: 'Recuerda todas las cartas, pero igual arriesga una segunda carta desconocida cuando no sabe qué hacer.',
      desc_advanced: 'Recuerda todas las cartas y nunca arriesga una segunda carta desconocida.',
      desc_expert: 'Recuerda todas las cartas y juega la mejor jugada calculada, y pasa cuando conviene.',
      yourTurn: 'Tu turno. Da vuelta una carta.',
      secondCard: 'Da vuelta una segunda carta.',
      pairYou: '¡Par! Sigues jugando.',
      pairAi: '{name} encontró un par.',
      aiTurn: '{name} está jugando…',
      missAuto: 'No coinciden.',
      missTap: 'No coinciden. Toca el tablero para seguir.',
      youPassed: 'Pasaste: ambas cartas ya eran conocidas.',
      aiPassed: '{name} pasó dando vuelta dos cartas conocidas.',
      gameOf: 'Partida {n} de {total}',
      singleGame: 'Partida suelta',
      seriesScore: 'Serie {a}–{b}',
      newGame: 'Nueva partida',
      restart: 'Reiniciar partida',
      nextGame: 'Siguiente partida',
      newSeries: 'Nueva serie',
      settings: 'Ajustes',
      rules: 'Reglas',
      close: 'Cerrar',
      viewBoard: 'Ver tablero',
      resWin: 'Ganaste',
      resLose: 'Gana {name}',
      resDraw: 'Empate',
      resCleared: 'Tú {a}, {name} {b}.',
      resTiebreakYou: '16–16, y tú tomaste el último par.',
      resTiebreakAi: '16–16, y {name} tomó el último par.',
      resStopped: 'Ambos pasaron, así que la partida terminó {a}–{b}.',
      resStoppedTieYou: 'Ambos pasaron con {a}–{b}, y tú tomaste el último par.',
      resStoppedTieAi: 'Ambos pasaron con {a}–{b}, y {name} tomó el último par.',
      resSeriesSoFar: 'Serie {a}–{b} tras {n} de {total} partidas.',
      resSeriesDone: 'Serie terminada {a}–{b}.',
      tip_missedPartner: 'Despiste: el otro {sym} estaba en {at}.',
      tip_gaveAway: 'Tu segunda carta desconocida le regaló el par de {sym}. Si la primera carta es nueva, la segunda debe ser una que ya conoces.',
      tip_risky2nd: 'Segunda carta arriesgada. Una carta desconocida puede regalarle un par al rival; era más seguro dar vuelta una que ya conocías.',
      tip_trap: 'Trampa: {u} par{es} sin tocar y {k} cartas sueltas conocidas. Aquí, dar vuelta una carta desconocida pierde en promedio. Pasa dando vuelta dos cartas que ya conoces.',
      tip_needlessPass: 'No hacía falta pasar. Aquí convenía dar vuelta una carta desconocida.',
      tip_leftPairs: 'Dejaste {n} par{es} conocido{s} en la mesa para tu rival. Primero recoge todos los pares que conoces.',
      sitKnown: 'Cartas sueltas conocidas',
      sitUntouched: 'Pares sin tocar',
      sitTrap: 'Trampa: pasa dando vuelta dos cartas que ya conoces.',
      setOpponent: 'Rival',
      setRestartNote: 'Los cambios de rival o de serie empiezan una nueva serie en tu próxima partida.',
      setInOrder: 'El rival explora en bloques de 2×2',
      setInOrderNote: 'En vez de dar vuelta cartas nuevas al azar, explora bloque por bloque desde a1 y completa los bloques que empiezas, como dos jugadores que se reparten el trabajo.',
      setCoach: 'Consejos del entrenador',
      setCoachNote: 'Revisa tus jugadas después de cada turno y muestra los conteos de la posición. Desactívalo para practicar en condiciones reales.',
      setCoords: 'Mostrar coordenadas (a1–h8)',
      setPace: 'Velocidad del rival',
      paceSlow: 'Lenta',
      paceNormal: 'Normal',
      paceFast: 'Rápida',
      setAiShow: 'Las cartas falladas del rival quedan visibles',
      setMyMiss: 'Tus cartas falladas quedan visibles',
      untilTap: 'Hasta que toque',
      setSeries: 'Partidas por serie',
      setLang: 'Idioma',
      langAuto: 'Según el dispositivo',
      record: 'Historial',
      recordLine: '{w} ganadas, {l} perdidas',
      resetRecord: 'Borrar historial',
      rulesTitle: 'Reglas y estrategia',
      a11yTaken: 'vacía',
      a11yDown: 'boca abajo',
      rulesHtml: `
<h3>Cómo se juega</h3>
<p>Dos jugadores, 32 pares en un cuadrado de 8 × 8. En tu turno das vuelta dos cartas. Si coinciden, el par es tuyo y sigues jugando. Si no, vuelven boca abajo y el turno pasa al rival.</p>
<p>Cuando se vacía el tablero, gana quien tiene más pares. Con 16–16, gana quien tomó el último par.</p>
<p>Dar vuelta dos cartas que ya eran conocidas cuenta como pasar. Si ambos jugadores pasan seguidos, la partida termina ahí: gana quien va adelante y, si hay empate, quien tomó el último par.</p>
<h3>Cómo ganar</h3>
<ol>
<li>Primero recoge todos los pares que conoces.</li>
<li>Da vuelta una carta desconocida. Si no sabes dónde está su pareja, que tu segunda carta sea una que ya viste. Una segunda carta desconocida muchas veces le regala un par al rival.</li>
<li>Cuidado con las trampas. Si queda exactamente un par sin tocar y conoces tres o más cartas sueltas, dar vuelta una carta desconocida suele regalar el resto del tablero. Mejor pasa, siempre que vayas adelante (o en empate habiendo tomado el último par). Con tres o cinco pares sin tocar y muchas cartas sueltas conocidas también hay trampa; con dos o cuatro, nunca.</li>
</ol>
<p>Una <em>carta suelta conocida</em> es una que ya viste pero cuya pareja no. Un <em>par sin tocar</em> es uno del que no se ha visto ninguna carta. Los consejos del entrenador cuentan ambas cosas por ti y avisan de las trampas.</p>
<h3>Entrenamiento</h3>
<p>Juega series completas. En un torneo lo difícil es no confundir las cartas de esta partida con las de la anterior. Las cartas que das vuelta se marcan con tu color y las del rival con el suyo.</p>
<p class="fine">Estas reglas siguen el formato habitual de los torneos alemanes. Los organizadores pueden variar en detalles, como cuándo exactamente una partida se considera trabada, así que confírmalo el día del torneo.</p>`,
    },
  };

  const PACE = {
    slow: { think: 900, between: 1000, pair: 800 },
    normal: { think: 600, between: 700, pair: 550 },
    fast: { think: 300, between: 400, pair: 300 },
  };
  const FLASH_MS = 450;
  const TIP_ORDER = ['missedPartner', 'gaveAway', 'trap', 'leftPairs', 'risky2nd', 'needlessPass'];

  /* ---------------- Saved settings and record ---------------- */
  const STORE_KEY = 'memory-duel/v1';
  const DEFAULTS = {
    level: 'advanced',
    inOrder: false,
    coach: true,
    coords: true,
    pace: 'normal',
    aiShow: '2',
    myMiss: '1.5',
    seriesLen: 8,
    lang: 'auto',
  };

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function writeStore() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ settings, record }));
    } catch (e) {
      // Storage unavailable (e.g. private browsing): the app still works, it just won't remember.
    }
  }
  const saved = readStore();
  const settings = Object.assign({}, DEFAULTS, saved.settings);
  if (!Core.LEVELS.includes(settings.level)) settings.level = DEFAULTS.level;
  const record = saved.record || {};

  /* ---------------- Language ---------------- */
  let lang = 'en';
  function resolveLang() {
    if (settings.lang === 'en' || settings.lang === 'es') return settings.lang;
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    return nav.toLowerCase().startsWith('es') ? 'es' : 'en';
  }
  function t(key, params) {
    let s = STRINGS[lang][key];
    if (s === undefined) s = STRINGS.en[key];
    if (s === undefined) return key;
    if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : ''));
    return s;
  }
  function applyLanguage() {
    lang = resolveLang();
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach((el) => {
      el.textContent = t(el.dataset.t);
    });
    document.querySelectorAll('[data-t-label]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.tLabel));
      el.title = t(el.dataset.tLabel);
    });
    $('#rulesBody').innerHTML = t('rulesHtml');
    buildLevels();
  }

  /* ---------------- State ---------------- */
  let g = null;
  let ai = null;
  let aiLevel = settings.level;
  let token = 0; // bumps on every new game so stale timers stop
  let busy = false;
  let series = null;
  let resetSeriesNext = false;
  let attempt = null; // coach context for the current attempt
  let turnTips = [];
  let shownTips = [];
  let status = { key: null, params: null };
  let continueMiss = null;
  const flippedBy = new Map();
  const flash = new Set();

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const aiName = () => t('level_' + aiLevel);
  const levelLabel = (level) => Core.LEVELS.indexOf(level) + 1 + ' · ' + t('level_' + level);

  function setStatus(key, params) {
    status = { key, params: params || null };
  }

  /* ---------------- Board ---------------- */
  const boardEl = $('#board');
  const cells = [];
  for (let i = 0; i < Core.CELLS; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'card';
    b.innerHTML = '<span class="inner"><span class="back"></span><span class="face"></span></span>';
    b.addEventListener('click', () => onCard(i));
    boardEl.appendChild(b);
    cells.push(b);
  }

  function render() {
    if (!g) return;
    $('#score0').textContent = g.scores[YOU];
    $('#score1').textContent = g.scores[AI];
    $('#name1').textContent = aiName();
    $('#p0').classList.toggle('active', !g.over && g.current === YOU);
    $('#p1').classList.toggle('active', !g.over && g.current === AI);
    $('#p0').classList.toggle('last', g.lastTaker === YOU);
    $('#p1').classList.toggle('last', g.lastTaker === AI);
    $('#gameNo').textContent = series.len > 1 ? t('gameOf', { n: series.n, total: series.len }) : t('singleGame');
    $('#seriesScore').textContent = series.len > 1 ? t('seriesScore', { a: series.wins[YOU], b: series.wins[AI] }) : '';
    document.body.dataset.turn = g.over ? 'over' : g.current === YOU ? 'you' : 'ai';
    $('.board-wrap').classList.toggle('coords', !!settings.coords);
    $('#btnMain').textContent = t(mainActionKey());

    g.cards.forEach((c, i) => {
      const el = cells[i];
      const isFlash = flash.has(i);
      const faceUp = c.state === 'up' || isFlash || (g.over && c.state === 'down');
      const by = flippedBy.get(i);
      el.classList.toggle('up', faceUp);
      el.classList.toggle('taken', c.state === 'taken' && !isFlash);
      el.classList.toggle('flash', isFlash);
      el.classList.toggle('reveal', g.over && c.state === 'down');
      el.classList.toggle('by-you', faceUp && by === YOU);
      el.classList.toggle('by-ai', faceUp && by === AI);
      el.querySelector('.face').textContent = Core.SYMBOLS[c.pair];
      const what = c.state === 'taken' && !isFlash ? t('a11yTaken') : faceUp ? Core.SYMBOLS[c.pair] : t('a11yDown');
      el.setAttribute('aria-label', Core.coord(i) + ', ' + what);
    });

    $('#status').textContent = status.key ? t(status.key, status.params) : '';
    renderSituation();
    renderCoach();
  }

  function renderSituation() {
    const box = $('#situation');
    box.innerHTML = '';
    if (!settings.coach || g.over || g.current !== YOU || g.pending !== null || g.shown || busy) return;
    const v = Core.knowledge(g, (i) => g.cards[i].seen);
    const k = v.singles.length;
    const u = (v.unseen.length - k) / 2;
    const ctx = {
      mine: g.scores[YOU],
      theirs: g.scores[AI],
      me: YOU,
      lastTaker: g.lastTaker,
      passStreak: g.passStreak,
      turnPairs: g.turnPairs + v.pairs.length,
    };
    const add = (label, value) => {
      const s = document.createElement('span');
      s.textContent = label + ' ';
      const b = document.createElement('b');
      b.textContent = value;
      s.appendChild(b);
      box.appendChild(s);
    };
    add(t('sitKnown'), k);
    add(t('sitUntouched'), u);
    if (Core.decide(k, u, ctx) === 'pass') {
      const s = document.createElement('span');
      s.className = 'trap';
      s.textContent = t('sitTrap');
      box.appendChild(s);
    }
  }

  function renderCoach() {
    const box = $('#coach');
    box.innerHTML = '';
    if (!settings.coach) return;
    for (const tip of shownTips) {
      const p = document.createElement('p');
      p.textContent = tipText(tip);
      box.appendChild(p);
    }
  }

  function tipText(tip) {
    const params = {};
    if (tip.pair !== undefined) params.sym = Core.SYMBOLS[tip.pair];
    if (tip.at !== undefined) params.at = Core.coord(tip.at);
    if (tip.k !== undefined) params.k = tip.k;
    if (tip.u !== undefined) {
      params.u = tip.u;
      params.s = tip.u === 1 ? '' : 's';
      params.es = tip.u === 1 ? '' : 'es';
    }
    if (tip.n !== undefined) {
      params.n = tip.n;
      params.s = tip.n === 1 ? '' : 's';
      params.es = tip.n === 1 ? '' : 'es';
    }
    return t('tip_' + tip.code, params);
  }

  function publishTips() {
    const seen = new Set();
    shownTips = turnTips
      .filter((tip) => !seen.has(tip.code) && seen.add(tip.code))
      .sort((a, b) => TIP_ORDER.indexOf(a.code) - TIP_ORDER.indexOf(b.code))
      .slice(0, 2);
    turnTips = [];
  }

  /* ---------------- Game flow ---------------- */
  function mainActionKey() {
    if (!g) return 'newGame';
    if (!g.over) return 'restart';
    if (resetSeriesNext || series.n >= series.len) return series.len > 1 || settings.seriesLen > 1 ? 'newSeries' : 'newGame';
    return 'nextGame';
  }

  function mainAction() {
    if (!g || resetSeriesNext) return newSeries();
    if (g.over) {
      if (series.n < series.len) {
        series.n++;
        return startGame();
      }
      return newSeries();
    }
    startGame(); // restart the current game without counting it
  }

  function newSeries() {
    resetSeriesNext = false;
    series = { n: 1, len: Number(settings.seriesLen) || 1, wins: [0, 0] };
    startGame();
  }

  function startGame() {
    token++;
    continueMiss = null;
    aiLevel = settings.level;
    const first = (series.n - 1) % 2 === 0 ? YOU : AI; // alternate who starts
    g = Core.createGame({ first });
    ai = Core.createAI(aiLevel, Math.random, { inOrder: !!settings.inOrder });
    flippedBy.clear();
    flash.clear();
    attempt = null;
    turnTips = [];
    shownTips = [];
    busy = false;
    setStatus(first === YOU ? 'yourTurn' : 'aiTurn', { name: aiName() });
    render();
    if (first === AI) runAI();
  }

  function reveal(i, who) {
    const pair = g.cards[i].pair;
    const ev = Core.flip(g, i);
    flippedBy.set(i, who);
    ai.observe(i, pair);
    if (ev.kind === 'pair') {
      ev.indices.forEach((j) => flash.add(j));
      const myToken = token;
      setTimeout(() => {
        if (myToken !== token) return;
        ev.indices.forEach((j) => flash.delete(j));
        render();
      }, FLASH_MS);
    }
    return ev;
  }

  function onCard(i) {
    if (!g || g.over) return;
    if (g.shown) {
      if (g.current === YOU && continueMiss) continueMiss();
      return;
    }
    if (busy || g.current !== YOU || g.cards[i].state !== 'down') return;

    if (g.pending === null) {
      shownTips = [];
      if (settings.coach) attempt = Core.coach.start(g, i);
    } else if (settings.coach && attempt) {
      turnTips.push(...Core.coach.second(g, attempt, i));
    }

    const ev = reveal(i, YOU);
    if (ev.kind === 'first') {
      setStatus('secondCard');
      render();
      return;
    }
    if (ev.kind === 'pair') {
      if (g.over) return endGame();
      setStatus('pairYou');
      render();
      return;
    }
    if (settings.coach && attempt) turnTips.push(...Core.coach.miss(g, attempt, ev));
    humanMiss(ev);
  }

  async function humanMiss(ev) {
    busy = true;
    const myToken = token;
    const tap = settings.myMiss === 'tap';
    setStatus(ev.pass ? 'youPassed' : tap ? 'missTap' : 'missAuto');
    render();
    await new Promise((resolve) => {
      let timer = null;
      const done = () => {
        if (timer) clearTimeout(timer);
        continueMiss = null;
        resolve();
      };
      continueMiss = done;
      if (!tap) timer = setTimeout(done, Number(settings.myMiss) * 1000);
    });
    if (myToken !== token) return;
    Core.endTurn(g);
    flippedBy.clear();
    publishTips();
    busy = false;
    if (g.over) return endGame();
    runAI();
  }

  async function runAI() {
    const myToken = token;
    const pace = PACE[settings.pace] || PACE.normal;
    busy = true;
    setStatus('aiTurn', { name: aiName() });
    render();
    await sleep(pace.think);
    while (myToken === token && !g.over && g.current === AI) {
      reveal(ai.choose(g), AI);
      render();
      await sleep(pace.between);
      if (myToken !== token) return;
      const ev = reveal(ai.choose(g), AI);
      if (ev.kind === 'pair') {
        setStatus('pairAi', { name: aiName() });
        render();
        await sleep(pace.pair);
        continue;
      }
      setStatus(ev.pass ? 'aiPassed' : 'aiTurn', { name: aiName() });
      render();
      await sleep(Number(settings.aiShow) * 1000);
      if (myToken !== token) return;
      Core.endTurn(g);
      flippedBy.clear();
      render();
    }
    if (myToken !== token) return;
    busy = false;
    if (g.over) return endGame();
    setStatus('yourTurn');
    render();
  }

  function endGame() {
    busy = true;
    const r = g.result;
    const a = g.scores[YOU];
    const b = g.scores[AI];
    if (r.winner !== null) series.wins[r.winner]++;
    const rec = record[aiLevel] || (record[aiLevel] = { w: 0, l: 0, d: 0 });
    if (r.winner === YOU) rec.w++;
    else if (r.winner === AI) rec.l++;
    else rec.d++;
    writeStore();
    publishTips();
    setStatus(null);
    render();

    const name = aiName();
    $('#resTitle').textContent = r.winner === YOU ? t('resWin') : r.winner === AI ? t('resLose', { name }) : t('resDraw');
    let detail;
    if (r.reason === 'cleared') {
      detail = r.tiebreak ? t(r.winner === YOU ? 'resTiebreakYou' : 'resTiebreakAi', { name }) : t('resCleared', { a, b, name });
    } else {
      detail = r.tiebreak
        ? t(r.winner === YOU ? 'resStoppedTieYou' : 'resStoppedTieAi', { a, b, name })
        : t('resStopped', { a, b });
    }
    $('#resDetail').textContent = detail;
    $('#resSeries').textContent =
      series.len > 1
        ? series.n >= series.len
          ? t('resSeriesDone', { a: series.wins[YOU], b: series.wins[AI] })
          : t('resSeriesSoFar', { a: series.wins[YOU], b: series.wins[AI], n: series.n, total: series.len })
        : '';
    $('#resNext').textContent = t(mainActionKey());
    const myToken = token;
    setTimeout(() => {
      if (myToken === token && !$('#dlgResult').open) $('#dlgResult').showModal();
    }, 700);
  }

  /* ---------------- Settings ---------------- */
  function buildLevels() {
    const box = $('#levels');
    box.innerHTML = '';
    for (const level of Core.LEVELS) {
      const label = document.createElement('label');
      label.className = 'level';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'level';
      input.value = level;
      input.checked = settings.level === level;
      input.addEventListener('change', () => {
        settings.level = level;
        resetSeriesNext = true;
        saveAndRefresh();
      });
      const nameEl = document.createElement('span');
      nameEl.className = 'lname';
      nameEl.textContent = levelLabel(level);
      const desc = document.createElement('span');
      desc.className = 'ldesc';
      desc.textContent = t('desc_' + level);
      label.append(input, nameEl, desc);
      box.appendChild(label);
    }
  }

  function buildRecord() {
    const list = $('#record');
    list.innerHTML = '';
    for (const level of Core.LEVELS) {
      const r = record[level] || { w: 0, l: 0, d: 0 };
      const li = document.createElement('li');
      const a = document.createElement('span');
      a.textContent = levelLabel(level);
      const b = document.createElement('span');
      b.textContent = t('recordLine', r);
      li.append(a, b);
      list.appendChild(li);
    }
  }

  function syncSettingsForm() {
    $('#optInOrder').checked = !!settings.inOrder;
    $('#optCoach').checked = !!settings.coach;
    $('#optCoords').checked = !!settings.coords;
    $('#optPace').value = settings.pace;
    $('#optAiShow').value = String(settings.aiShow);
    $('#optMyMiss').value = String(settings.myMiss);
    $('#optSeries').value = String(settings.seriesLen);
    $('#optLang').value = settings.lang;
    buildRecord();
  }

  function saveAndRefresh() {
    writeStore();
    render();
  }

  $('#optInOrder').addEventListener('change', (e) => {
    settings.inOrder = e.target.checked;
    if (ai) ai.inOrder = settings.inOrder; // takes effect right away
    saveAndRefresh();
  });
  $('#optCoach').addEventListener('change', (e) => {
    settings.coach = e.target.checked;
    if (!settings.coach) shownTips = [];
    saveAndRefresh();
  });
  $('#optCoords').addEventListener('change', (e) => {
    settings.coords = e.target.checked;
    saveAndRefresh();
  });
  $('#optPace').addEventListener('change', (e) => {
    settings.pace = e.target.value;
    saveAndRefresh();
  });
  $('#optAiShow').addEventListener('change', (e) => {
    settings.aiShow = e.target.value;
    saveAndRefresh();
  });
  $('#optMyMiss').addEventListener('change', (e) => {
    settings.myMiss = e.target.value;
    saveAndRefresh();
  });
  $('#optSeries').addEventListener('change', (e) => {
    settings.seriesLen = Number(e.target.value);
    resetSeriesNext = true;
    saveAndRefresh();
  });
  $('#optLang').addEventListener('change', (e) => {
    settings.lang = e.target.value;
    applyLanguage();
    buildRecord();
    saveAndRefresh();
  });
  $('#btnResetRecord').addEventListener('click', () => {
    for (const k of Object.keys(record)) delete record[k];
    buildRecord();
    writeStore();
  });

  /* ---------------- Dialogs and buttons ---------------- */
  document.querySelectorAll('dialog').forEach((d) => {
    d.addEventListener('click', (e) => {
      if (e.target === d || e.target.closest('[data-close]')) d.close();
    });
  });
  $('#btnSettings').addEventListener('click', () => {
    syncSettingsForm();
    $('#dlgSettings').showModal();
  });
  $('#btnRules').addEventListener('click', () => $('#dlgRules').showModal());
  $('#btnMain').addEventListener('click', mainAction);
  $('#resNext').addEventListener('click', () => {
    $('#dlgResult').close();
    mainAction();
  });

  /* ---------------- Start ---------------- */
  applyLanguage();
  newSeries();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
