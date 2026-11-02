# Hook a Duck

Catch the rubber ducks floating round the stream before you run out of casts.

## How to play

- Move the mouse to line the rod up with a duck, and click to lower the hook.
- The hook takes half a second to come down, so aim a little ahead of the duck.
- You have 8 casts, one at a time. The round ends when the last cast has come down.
- Click again on the game over screen to play another round.

## Scoring

Each duck has a number on its base, and that is what it scores when the hook
catches it. The hook catches the duck nearest to it, within 26 px, when it
reaches the water. A caught duck goes back to the start of the stream.

| Base number | Ducks |
| ----------- | ----- |
| 5           | 3     |
| 10          | 2     |
| 20          | 2     |
| 50          | 1     |

Your final score is saved to the carnival's score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `cast`, `step`, `duckUnderHook`) and
  the `hookADuck` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
