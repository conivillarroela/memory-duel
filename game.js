/*
 * Memory Duel: rules, position analysis and computer opponents.
 *
 * Pure logic with no DOM access, so the same file runs in the browser (app.js)
 * and in Node (test/simulate.js).
 *
 * Board: 32 pairs on an 8x8 grid. Index 0 is the top-left card (a8) and
 * index 63 the bottom-right card (h1), like chess coordinates.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MemoryCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PAIRS = 32;
  const CELLS = PAIRS * 2;
  const SIZE = 8;

  // Everyday objects and animals, in the spirit of classic tournament sets.
  const SYMBOLS = [
    '🍎', '🦉', '🐸', '🐟', '🏠', '🚂', '✈️', '⛵',
    '🐍', '🐌', '🌷', '🐦', '⏰', '👟', '🏰', '🔦',
    '🎈', '🐶', '🐱', '🦓', '🍓', '🍦', '🐉', '👻',
    '🖍️', '🤡', '🌳', '🍐', '🏍️', '👛', '🐛', '🥕',
  ];

  function coord(i) {
    return 'abcdefgh'[i % SIZE] + (SIZE - Math.floor(i / SIZE));
  }

  // Small seedable RNG so simulations are reproducible.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(list, rng) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function pick(list, rng) {
    return list[Math.floor(rng() * list.length)];
  }

  /* ------------------------------------------------------------------
   * Best-play tables
   *
   * A position is described from the point of view of the player to move,
   * after they have collected every pair whose two cards they have seen:
   *   k = known singles: seen cards whose partner has never been seen
   *   u = untouched pairs: pairs where neither card has been seen
   * V[k][u] is the expected (my future pairs - opponent's future pairs)
   * when both sides play well. The available moves are:
   *   NEW  flip an unseen card first (then pick the best second card)
   *   ALT  flip a known single first, then an unseen card
   *   PASS flip two known singles (needs k >= 2). If the opponent faces the
   *        same position and also passes, the game is stuck, which we value
   *        at 0 here; the tournament tiebreak is handled in decide().
   * ------------------------------------------------------------------ */
  const V = [];
  const NEW = [];
  const ALT = [];
  for (let k = 0; k <= PAIRS; k++) {
    V.push(new Float64Array(PAIRS + 1));
    NEW.push(new Float64Array(PAIRS + 1));
    ALT.push(new Float64Array(PAIRS + 1).fill(-Infinity));
  }

  // Values of the second card after a first card from an untouched pair.
  // k = known singles besides that card, u = untouched pairs including its pair.
  function secondCard(k, u) {
    const m = k + 2 * u - 1; // unseen cards left to choose from
    const known = k >= 1 ? -V[k + 1][u - 1] : -Infinity;
    let unknown = (1 + V[k][u - 1]) / m; // found its partner, keep playing
    if (k > 0) unknown -= (k * (1 + V[k][u - 1])) / m; // handed over a pair
    if (u >= 2) unknown -= ((2 * u - 2) * V[k + 2][u - 2]) / m; // two new singles
    return { known, unknown };
  }

  (function computeTables() {
    for (let u = 0; u <= PAIRS; u++) {
      for (let k = 0; k + u <= PAIRS; k++) {
        if (k === 0 && u === 0) continue;
        const n = k + 2 * u; // unseen cards
        let fNew = 0;
        if (k > 0) fNew += (k / n) * (1 + V[k - 1][u]);
        if (u > 0) {
          const s = secondCard(k, u);
          fNew += ((2 * u) / n) * Math.max(s.known, s.unknown);
        }
        let fAlt = -Infinity;
        if (k >= 1) {
          fAlt = (1 + V[k - 1][u]) / n;
          if (k >= 2) fAlt -= ((k - 1) * (1 + V[k - 1][u])) / n;
          if (u >= 1) fAlt -= ((2 * u) * V[k + 1][u - 1]) / n;
        }
        NEW[k][u] = fNew;
        ALT[k][u] = fAlt;
        const flip = Math.max(fNew, fAlt);
        V[k][u] = k >= 2 ? Math.max(flip, 0) : flip;
      }
    }
  })();

  /*
   * Best move with the tournament stop rule: if both players pass in a row
   * the leader wins, and a tie goes to whoever took the last pair.
   * ctx = { mine, theirs, me, lastTaker, passStreak, turnPairs }
   * Returns 'new', 'alt' or 'pass'.
   */
  function decide(k, u, ctx) {
    const fNew = NEW[k][u];
    const fAlt = ALT[k][u];
    const flip = fAlt > fNew + 1e-9 ? 'alt' : 'new';
    if (k < 2) return flip;
    const stopWins = ctx.mine > ctx.theirs || (ctx.mine === ctx.theirs && ctx.lastTaker === ctx.me);
    const passEndsGame = ctx.passStreak >= 1 && ctx.turnPairs === 0;
    if (passEndsGame) return stopWins ? 'pass' : flip;
    if (Math.max(fNew, fAlt) < 0 && stopWins) return 'pass';
    return flip;
  }

  /* ------------------------------------------------------------------
   * Game state and rules
   * ------------------------------------------------------------------ */
  function createGame(opts) {
    opts = opts || {};
    const rng = opts.rng || Math.random;
    const pairs = shuffle(Array.from({ length: CELLS }, (_, i) => i >> 1), rng);
    return {
      cards: pairs.map((pair) => ({ pair, state: 'down', seen: false })), // state: down | up | taken
      scores: [0, 0],
      current: opts.first === 1 ? 1 : 0,
      lastTaker: null,
      taken: 0,
      pending: null, // first card of the current attempt
      pendingWasSeen: false,
      shown: null, // { indices, pass } while a miss is on display
      passStreak: 0,
      turnPairs: 0,
      flips: 0,
      over: false,
      result: null, // { winner: 0 | 1 | null, reason: 'cleared' | 'stopped', tiebreak }
    };
  }

  function flip(g, i) {
    if (g.over) throw new Error('Game is over');
    if (g.shown) throw new Error('Finish the current miss first');
    const c = g.cards[i];
    if (!c || c.state !== 'down') throw new Error('Card ' + i + ' is not face down');
    const wasSeen = c.seen;
    c.state = 'up';
    c.seen = true;
    g.flips++;
    if (g.pending === null) {
      g.pending = i;
      g.pendingWasSeen = wasSeen;
      return { kind: 'first', index: i, wasSeen };
    }
    const a = g.pending;
    g.pending = null;
    if (g.cards[a].pair === c.pair) {
      g.cards[a].state = 'taken';
      c.state = 'taken';
      g.scores[g.current]++;
      g.taken++;
      g.turnPairs++;
      g.lastTaker = g.current;
      if (g.taken === PAIRS) finish(g, 'cleared');
      return { kind: 'pair', indices: [a, i] };
    }
    const pass = g.pendingWasSeen && wasSeen;
    g.shown = { indices: [a, i], pass };
    return { kind: 'miss', indices: [a, i], pass };
  }

  // Turn the missed cards back over and hand the turn to the other player.
  function endTurn(g) {
    if (!g.shown) throw new Error('No miss to resolve');
    const { indices, pass } = g.shown;
    for (const i of indices) g.cards[i].state = 'down';
    g.shown = null;
    if (pass) g.passStreak = g.turnPairs > 0 ? 1 : g.passStreak + 1;
    else g.passStreak = 0;
    g.turnPairs = 0;
    if (g.passStreak >= 2) {
      finish(g, 'stopped');
      return;
    }
    g.current = 1 - g.current;
  }

  function finish(g, reason) {
    g.over = true;
    const [a, b] = g.scores;
    let winner = null;
    let tiebreak = false;
    if (a !== b) winner = a > b ? 0 : 1;
    else if (g.lastTaker !== null) {
      winner = g.lastTaker;
      tiebreak = true;
    }
    g.result = { winner, reason, tiebreak };
  }

  // Splits face-down cards by what a viewer knows. known(i) says whether the
  // viewer has seen card i. Returns known pairs, known singles and unseen cards.
  function knowledge(g, known) {
    const pairs = [];
    const singles = [];
    const unseen = [];
    const firstOfPair = new Map();
    g.cards.forEach((c, i) => {
      if (c.state !== 'down') return;
      if (!known(i)) {
        unseen.push(i);
        return;
      }
      if (firstOfPair.has(c.pair)) {
        pairs.push([firstOfPair.get(c.pair), i]);
        firstOfPair.delete(c.pair);
      } else firstOfPair.set(c.pair, i);
    });
    for (const i of firstOfPair.values()) singles.push(i);
    return { pairs, singles, unseen };
  }

  function contextFor(g, me, extraPairs) {
    return {
      mine: g.scores[me],
      theirs: g.scores[1 - me],
      me,
      lastTaker: g.lastTaker,
      passStreak: g.passStreak,
      turnPairs: g.turnPairs + (extraPairs || 0),
    };
  }

  /* ------------------------------------------------------------------
   * Computer opponents
   *   beginner: forgets about 1 card in 7; second card is a random unknown
   *   casual:   remembers everything; second card is a random unknown
   *   advanced: remembers everything; second card is a known card when possible
   *   expert:   remembers everything; follows the best-play tables, including passes
   * ------------------------------------------------------------------ */
  const LEVELS = ['beginner', 'casual', 'advanced', 'expert'];
  const RECALL = { beginner: 0.85, casual: 1, advanced: 1, expert: 1 };

  function createAI(level, rng) {
    if (!LEVELS.includes(level)) throw new Error('Unknown level ' + level);
    rng = rng || Math.random;
    const mem = new Map(); // index -> pair id, for face-down cards it remembers
    let plan = null; // second card decided together with the first one

    function observe(i, pair) {
      if (!mem.has(i) && rng() < RECALL[level]) mem.set(i, pair);
    }

    function view(g) {
      for (const i of mem.keys()) if (g.cards[i].state === 'taken') mem.delete(i);
      return knowledge(g, (i) => mem.has(i));
    }

    function choose(g) {
      if (g.pending === null) {
        plan = null;
        const v = view(g);
        if (v.pairs.length) {
          plan = v.pairs[0][1];
          return v.pairs[0][0];
        }
        if (level === 'expert') {
          const k = v.singles.length;
          const u = (v.unseen.length - k) / 2;
          const move = decide(k, u, contextFor(g, g.current));
          if (move === 'pass') {
            const [a, b] = shuffle(v.singles.slice(), rng);
            plan = b;
            return a;
          }
          if (move === 'alt') {
            plan = 'unseen';
            return pick(v.singles, rng);
          }
        }
        return pick(v.unseen, rng);
      }

      // Second card of the attempt.
      const planned = plan;
      plan = null;
      if (typeof planned === 'number' && g.cards[planned].state === 'down') return planned;
      const firstPair = g.cards[g.pending].pair;
      for (const [i, p] of mem) {
        if (p === firstPair && i !== g.pending && g.cards[i].state === 'down') return i;
      }
      const v = view(g);
      if (planned === 'unseen' || v.singles.length === 0) return pick(v.unseen, rng);
      if (level === 'advanced') return pick(v.singles, rng);
      if (level === 'expert') {
        const k = v.singles.length;
        const u = (v.unseen.length - k + 1) / 2; // +1: the first card's own pair
        const s = secondCard(k, u);
        return s.known >= s.unknown ? pick(v.singles, rng) : pick(v.unseen, rng);
      }
      return pick(v.unseen, rng);
    }

    return { level, observe, choose };
  }

  /* ------------------------------------------------------------------
   * Coach: reviews a human's moves against perfect memory and best play.
   * Call start() before the first card of each attempt, second() before
   * the second card, and miss() right after a miss.
   * ------------------------------------------------------------------ */
  function seenView(g) {
    return knowledge(g, (i) => g.cards[i].seen);
  }

  function coachStart(g, i) {
    const v = seenView(g);
    const k = v.singles.length;
    const u = (v.unseen.length - k) / 2;
    const inPair = v.pairs.some((p) => p[0] === i || p[1] === i);
    return {
      k,
      u,
      rec: decide(k, u, contextFor(g, g.current, v.pairs.length)),
      best: Math.max(NEW[k][u], ALT[k][u]),
      kind: inPair ? 'collect' : v.singles.includes(i) ? 'known' : 'new',
      pairs: v.pairs,
    };
  }

  function partnerOf(g, i) {
    const p = g.cards[i].pair;
    for (let j = 0; j < CELLS; j++) if (j !== i && g.cards[j].pair === p) return j;
    return -1;
  }

  function coachSecond(g, att, i) {
    const tips = [];
    const first = g.pending;
    const partner = partnerOf(g, first);
    const partnerKnown = g.cards[partner].seen && g.cards[partner].state === 'down';
    if (i === partner) return tips;
    if (partnerKnown) {
      tips.push({ code: 'missedPartner', pair: g.cards[first].pair, at: partner });
    } else if (att.kind === 'new' && !g.cards[i].seen) {
      const v = seenView(g);
      const k = v.singles.length;
      if (k >= 1) {
        const u = (v.unseen.length - k + 1) / 2;
        const s = secondCard(k, u);
        if (s.known > s.unknown + 0.05) {
          const ip = g.cards[i].pair;
          const gave = g.cards.some((c, j) => j !== i && c.pair === ip && c.seen && c.state === 'down');
          tips.push({ code: gave ? 'gaveAway' : 'risky2nd', pair: ip });
        }
      }
    } else if (att.kind === 'known' && g.cards[i].seen) {
      if (att.rec !== 'pass' && att.best > 0.1) tips.push({ code: 'needlessPass' });
    }
    return tips;
  }

  function coachMiss(g, att, ev) {
    const tips = [];
    if (!ev.pass && att.kind !== 'collect' && att.rec === 'pass') {
      tips.push({ code: 'trap', k: att.k, u: att.u });
    }
    const left = att.pairs.filter(([a]) => g.cards[a].state !== 'taken').length;
    if (left) tips.push({ code: 'leftPairs', n: left });
    return tips;
  }

  return {
    PAIRS,
    CELLS,
    SIZE,
    SYMBOLS,
    LEVELS,
    coord,
    mulberry32,
    createGame,
    flip,
    endTurn,
    knowledge,
    decide,
    secondCard,
    createAI,
    coach: { start: coachStart, second: coachSecond, miss: coachMiss },
    tables: { V, NEW, ALT },
  };
});
