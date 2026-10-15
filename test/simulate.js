#!/usr/bin/env node
/*
 * Headless checks for game.js.
 *   node test/simulate.js          # 2000 games per matchup
 *   node test/simulate.js 10000    # more games, tighter percentages
 *
 * 1. Rules: pairs, misses, the pass/stop rule and tiebreaks on fixed boards.
 * 2. Best-play tables: sanity checks and where passing starts to pay off.
 * 3. Thousands of computer-vs-computer games, checking invariants on every move
 *    and printing how often each level beats the others.
 */
'use strict';

const assert = require('assert');
const Core = require('../game.js');

const GAMES = Number(process.argv[2]) || 2000;
let checks = 0;
function check(cond, msg) {
  assert.ok(cond, msg);
  checks++;
}

// A board where cards 2n and 2n+1 are a pair, so moves are predictable.
function fixedGame(first) {
  const g = Core.createGame({ first: first || 0, rng: Core.mulberry32(1) });
  g.cards = Array.from({ length: Core.CELLS }, (_, i) => ({ pair: i >> 1, state: 'down', seen: false }));
  return g;
}

/* ---------- 1. Rules ---------- */
(function rules() {
  let g = fixedGame(0);
  let ev = Core.flip(g, 0);
  check(ev.kind === 'first', 'first flip reports first');
  ev = Core.flip(g, 1);
  check(ev.kind === 'pair' && g.scores[0] === 1 && g.current === 0, 'a pair scores and keeps the turn');
  check(g.lastTaker === 0, 'pair sets last taker');

  ev = Core.flip(g, 2);
  ev = Core.flip(g, 4);
  check(ev.kind === 'miss' && !ev.pass, 'two new cards that differ are a miss, not a pass');
  assert.throws(() => Core.flip(g, 6), 'cannot flip while a miss is shown');
  Core.endTurn(g);
  check(g.current === 1 && g.passStreak === 0, 'miss hands over the turn');
  check(g.cards[2].state === 'down' && g.cards[4].state === 'down', 'missed cards go back down');

  ev = Core.flip(g, 2);
  ev = Core.flip(g, 4);
  check(ev.pass, 'two known cards are a pass');
  Core.endTurn(g);
  check(!g.over && g.passStreak === 1, 'one pass does not end the game');

  ev = Core.flip(g, 4);
  ev = Core.flip(g, 2);
  Core.endTurn(g);
  check(g.over && g.result.reason === 'stopped', 'two passes in a row stop the game');
  check(g.result.winner === 0 && !g.result.tiebreak, 'stopped game goes to the leader');

  // Collecting pairs and then passing only counts as the first pass.
  g = fixedGame(0);
  Core.flip(g, 0); Core.flip(g, 2); Core.endTurn(g); // P0 sees 0 and 2
  Core.flip(g, 4); Core.flip(g, 6); Core.endTurn(g); // P1 sees 4 and 6
  Core.flip(g, 0); Core.flip(g, 4); Core.endTurn(g); // P0 passes: streak 1
  check(g.passStreak === 1, 'first pass');
  Core.flip(g, 1); Core.flip(g, 0); // P1 collects pair 0...
  Core.flip(g, 2); Core.flip(g, 4); Core.endTurn(g); // ...then passes
  check(!g.over && g.passStreak === 1, 'a pass after collecting a pair restarts the streak');
  Core.flip(g, 2); Core.flip(g, 6); Core.endTurn(g); // P0 passes again
  check(g.over && g.result.winner === 1, 'stopped: P1 leads 1-0');

  // Tie on a stop goes to whoever took the last pair.
  g = fixedGame(0);
  Core.flip(g, 0); Core.flip(g, 1); // P0 takes a pair
  Core.flip(g, 2); Core.flip(g, 4); Core.endTurn(g);
  Core.flip(g, 3); Core.flip(g, 2); // P1 takes a pair: 1-1, last taker P1
  Core.flip(g, 4); Core.flip(g, 6); Core.endTurn(g);
  Core.flip(g, 4); Core.flip(g, 6); Core.endTurn(g); // P0 passes
  Core.flip(g, 6); Core.flip(g, 4); Core.endTurn(g); // P1 passes
  check(g.over && g.result.winner === 1 && g.result.tiebreak, 'tied stop goes to the last taker');

  // 16-16 clear: last pair decides.
  g = fixedGame(0);
  for (let p = 0; p < Core.PAIRS; p++) {
    g.current = p % 2; // alternate who takes each pair
    Core.flip(g, 2 * p); Core.flip(g, 2 * p + 1);
  }
  check(g.over && g.result.reason === 'cleared', 'clearing the board ends the game');
  check(g.scores[0] === 16 && g.scores[1] === 16, '16-16');
  check(g.result.winner === 1 && g.result.tiebreak, '16-16 goes to whoever took the last pair');
})();


/* ---------- 2b. Coach ---------- */
(function coach() {
  // Memory slip: partner of the first card was known.
  let g = fixedGame(0);
  Core.flip(g, 0); Core.flip(g, 2); Core.endTurn(g); // P0 sees 0 and 2
  Core.flip(g, 4); Core.flip(g, 6); Core.endTurn(g); // P1 sees 4 and 6
  let att = Core.coach.start(g, 1);
  check(att.kind === 'new', 'card 1 is new');
  Core.flip(g, 1);
  let tips = Core.coach.second(g, att, 3);
  check(tips.some((t) => t.code === 'missedPartner' && t.at === 0), 'coach spots a memory slip');
  check(Core.coach.second(g, att, 0).length === 0, 'taking the known partner is fine');

  // Second unknown card that hands over a pair.
  g = fixedGame(0);
  Core.flip(g, 0); Core.flip(g, 2); Core.endTurn(g); // singles 0 and 2 known
  att = Core.coach.start(g, 8);
  Core.flip(g, 8); // fresh card
  tips = Core.coach.second(g, att, 3); // 3 is 2's unseen partner
  check(tips.some((t) => t.code === 'gaveAway'), 'coach flags a second unknown card that gives a pair away');
  tips = Core.coach.second(g, att, 12);
  check(tips.some((t) => t.code === 'risky2nd'), 'coach flags a risky second unknown card');
  check(Core.coach.second(g, att, 2).length === 0, 'a known second card is the safe choice');

  // Trap position: 3 known singles, 1 untouched pair, player ahead.
  g = fixedGame(0);
  for (let i = 0; i < 56; i++) g.cards[i].state = 'taken';
  g.taken = 28; g.scores = [15, 13]; g.lastTaker = 0;
  for (const i of [56, 58, 60]) g.cards[i].seen = true;
  att = Core.coach.start(g, 62);
  check(att.k === 3 && att.u === 1 && att.rec === 'pass', 'k=3, u=1 while ahead: best move is to pass');
  Core.flip(g, 62);
  const ev = Core.flip(g, 56);
  tips = Core.coach.miss(g, att, ev);
  check(tips.some((t) => t.code === 'trap'), 'coach flags flipping into a trap');

  // Leaving a known pair on the table.
  g = fixedGame(0);
  Core.flip(g, 0); Core.flip(g, 2); Core.endTurn(g);
  Core.flip(g, 1); Core.flip(g, 4); Core.endTurn(g); // pair 0 now fully known (0 and 1)
  att = Core.coach.start(g, 10);
  Core.flip(g, 10);
  tips = Core.coach.second(g, att, 2);
  const ev2 = Core.flip(g, 2);
  tips = Core.coach.miss(g, att, ev2);
  check(tips.some((t) => t.code === 'leftPairs' && t.n === 1), 'coach flags a known pair left on the table');
})();

/* ---------- 2. Best-play tables ---------- */
const { V, NEW, ALT } = Core.tables;
(function tables() {
  for (let k = 0; k <= Core.PAIRS; k++) {
    check(Math.abs(V[k][0] - k) < 1e-9, `with nothing untouched you take all ${k} pairs`);
  }
  check(Math.abs(V[0][1] - 1) < 1e-9, 'one untouched pair alone: flip both, take it');
  for (let u = 0; u <= Core.PAIRS; u++) {
    for (let k = 0; k + u <= Core.PAIRS; k++) {
      check(Number.isFinite(V[k][u]), `V(${k},${u}) is finite`);
      check(Math.abs(V[k][u]) <= k + u + 1e-9, `|V(${k},${u})| <= remaining pairs`);
    }
  }
  const ctxAhead = { mine: 5, theirs: 3, me: 0, lastTaker: 0, passStreak: 0, turnPairs: 0 };
  const ctxBehind = { mine: 3, theirs: 5, me: 0, lastTaker: 1, passStreak: 0, turnPairs: 0 };
  check(Core.decide(10, 1, ctxAhead) === 'pass', 'ahead with 10 known singles and 1 untouched pair: pass');
  check(Core.decide(10, 1, ctxBehind) !== 'pass', 'behind: passing would lose on a stop, so flip');
  check(Core.decide(10, 1, { ...ctxBehind, mine: 6, passStreak: 1 }) === 'pass', 'ahead after opponent passed: pass to win');
  check(Core.decide(0, 10, ctxAhead) === 'new', 'opening: flip a new card');
})();

console.log('Where passing beats flipping (expected value < 0), by untouched pairs u:');
for (let u = 1; u <= 6; u++) {
  const ks = [];
  for (let k = 2; k + u <= Core.PAIRS; k++) if (Math.max(NEW[k][u], ALT[k][u]) < 0) ks.push(k);
  const text = ks.length ? `k = ${ks[0]}…${ks[ks.length - 1]} known singles` : 'never';
  console.log(`  u = ${u}: ${text}`);
}
console.log('');

/* ---------- 3. Computer vs computer ---------- */
function playGame(levels, rng, first) {
  const g = Core.createGame({ rng, first });
  const ais = levels.map((l) => Core.createAI(l, rng));
  let guard = 0;
  while (!g.over) {
    if (++guard > 5000) throw new Error('game did not finish');
    const p = g.current;
    const i = ais[p].choose(g);
    check(g.cards[i] && g.cards[i].state === 'down', `${levels[p]} picked a face-down card`);
    const ev = Core.flip(g, i);
    for (const ai of ais) ai.observe(i, g.cards[i].pair);
    if (ev.kind === 'miss') Core.endTurn(g);
    check(g.scores[0] + g.scores[1] === g.taken, 'scores add up to pairs taken');
  }
  if (g.result.reason === 'cleared') check(g.taken === Core.PAIRS, 'cleared means all 32 pairs taken');
  return g;
}

const rng = Core.mulberry32(20261022);
const L = Core.LEVELS;
const rows = [];
for (const a of L) {
  const row = [];
  for (const b of L) {
    let wins = 0;
    for (let n = 0; n < GAMES; n++) {
      const g = playGame([a, b], rng, n % 2);
      if (g.result.winner === 0) wins++;
    }
    row.push(wins / GAMES);
  }
  rows.push(row);
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`Win rate of the row player against the column player (${GAMES} games each, alternating who starts):`);
console.log(pad('', 10) + L.map((l) => pad(l, 10)).join(''));
rows.forEach((row, r) => console.log(pad(L[r], 10) + row.map((x) => pad((100 * x).toFixed(1) + '%', 10)).join('')));

// Stronger levels should beat weaker ones.
for (let r = 1; r < L.length; r++) {
  check(rows[r][r - 1] > 0.5, `${L[r]} should beat ${L[r - 1]}`);
}
console.log(`\nAll ${checks.toLocaleString('en-US')} checks passed.`);
