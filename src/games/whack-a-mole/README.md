# Whack-a-Mole

Whack the moles as they pop up from the holes before the clock runs out.

## How to play

- Moles pop up from a 3 by 3 grid of holes, then drop back down.
- Click a mole while it is up to whack it.
- The round lasts 30 seconds. Click again on the game over screen to play another round.

## Scoring

Each whack scores 10 points. Clicking an empty hole scores nothing.

Moles get faster as the round goes on: a new mole pops up every 1 second at the
start and every 0.35 seconds at the end, and each stays up for 1.2 seconds at the
start and 0.5 seconds at the end.

Your final score is saved to the carnival's score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `popMole`, `whack`, `step`) and the
  `whackAMole` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
