# Memory Duel

A tournament-style memory trainer: 32 pairs on an 8×8 board, one-on-one against the computer, following the usual German
tournament rules. It runs in any browser and installs on an iPhone home screen, where it works offline.

It's plain HTML, CSS and JavaScript, with no build step and no dependencies.

```
memory-duel/
  index.html             page and styles
  app.js                 screen, turn flow, settings, English/Spanish text
  game.js                rules, best-play math, computer opponents, coach
  sw.js                  offline support (only active over https)
  manifest.webmanifest   home-screen name, icon, colors
  icons/                 app icons
  test/simulate.js       automated checks and computer-vs-computer simulations
```

## Features

- The tournament format: an 8×8 board with 32 pairs, played one-on-one. A pair lets you play again. At 16–16, whoever
  took the last pair wins. If both players pass in a row, the game stops and the leader wins.
- Ten computer opponents, from Amnesiac (remembers nothing) to Optimal (plays the mathematically best move in every
  position, including passing).
- An option to have the computer explore the board in 2×2 blocks, finishing any block you start, the way two players
  sharing the work would. Otherwise it flips new cards at random.
- Coach tips: after each of her turns, it flags memory slips (naming the square she should have flipped), risky second
  cards, known pairs left on the table, and trap positions. Turn it off for realistic practice.
- Series of 6, 8 or 10 games, alternating who starts. This trains the hardest tournament skill: not mixing up this
  game’s cards with the last one’s.
- Practical extras: optional a1–h8 coordinates for mnemonic systems, adjustable display times, English/Spanish (follows
  the phone’s language), dark mode, and a win record per opponent.

## Updating

Edit the files, bump `CACHE` in `sw.js` (currently `memory-duel-v2`, next `v3`, and so on), and upload or push again.
On the iPhone, open the app, close it, and open it again. The first launch downloads the update in the background, and
the second one shows it.

## How the computer plays

| #  | Opponent       | Memory                     | Second card when stuck   |
|----|----------------|----------------------------|--------------------------|
| 1  | Amnesiac       | remembers nothing (random) | unknown                  |
| 2  | Scatterbrained | forgets about 6 cards in 7 | unknown                  |
| 3  | Forgetful      | forgets about 5 in 7       | unknown                  |
| 4  | Distracted     | forgets about 4 in 7       | unknown                  |
| 5  | Inconsistent   | forgets about 3 in 7       | unknown                  |
| 6  | Fallible       | forgets about 2 in 7       | unknown                  |
| 7  | Mostly sharp   | forgets about 1 in 7       | unknown                  |
| 8  | Reckless       | remembers everything       | unknown                  |
| 9  | Careful        | remembers everything       | a card it already knows  |
| 10 | Optimal        | remembers everything       | calculated best move     |

Optimal plays moves calculated as best for every position, including passing in trap positions. Forgetting is
rolled each time a card is seen, so a card that shows up again gets another chance to stick.

With **Opponent explores in 2×2 blocks** on, the computer picks unknown cards block by block instead of at random. The
board is split into 16 blocks (a1–b2, a3–b4, … then c1–d2, …). It first finishes the block of the latest newly flipped
card, so if you flip a1 and a2, it continues with b1 and b2. Then it finishes any other started block, and then it
opens the next fresh block with a1, a2. The blocks are fixed, so a pair of cards straddling two blocks (b3, c3) gets
each block finished on its own. Strategy is unchanged. Careful and Optimal still prefer a known second card, so after
the opening they add one new card per turn. Forgetful levels still know which squares have been explored, just not
what was there.

The math behind Optimal and the coach is in `game.js`. It's a table of expected outcomes for every combination of "known
singles" and "untouched pairs". One finding from it is in the Rules sheet: passing only pays with an odd number of
untouched pairs (1, 3 or 5) and enough known singles. With one untouched pair, three known singles is already enough.

The rules follow the usual German tournament format: 32 pairs, 8×8, most pairs wins, last pair breaks ties, and two
passes in a row stop the game. Organizers can differ in details, so check on the day.
