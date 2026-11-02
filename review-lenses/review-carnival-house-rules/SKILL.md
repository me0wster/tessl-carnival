---
name: review-carnival-house-rules
description: Review a change to a carnival game for the first three house rules in AGENTS.md: the game registers on the midway, reports scores through recordScore from src/carnival, and draws with theme and canvasFont. Use when reviewing changes under src/games/.
---

# Review lens: Carnival House Rules

Review whether a game under `src/games/` follows house rules 1 to 3 in `AGENTS.md`, so every game shows up on the midway, shares one score table and looks like the carnival.

## Scope

- **Registration** (rule 1) A game lives in `src/games/<game-id>/`, its `game.ts` has its `CarnivalGame` as the default export, and its `id` is the folder name. `src/games/index.ts` finds games from that default export, and it throws while loading if a game has no default export or its `id` differs from its folder name, which stops the whole carnival from starting.
- **Scores** (rule 2) A game calls `recordScore(game.id, score)` from `src/carnival` once, when a round ends. It does not read or write local storage, or keep its own high score table.
- **Theme** (rule 3) Colours, fonts and sizes come from `theme` and `canvasFont` in `src/carnival/theme.ts`. A game has no hex colours, `rgb()` or `hsl()` literals, named colours or font strings of its own.

## Method

Read `AGENTS.md` for the rules, `src/carnival/registry.ts` for the `CarnivalGame` shape, `src/carnival/scores.ts` for `recordScore`, and `src/carnival/theme.ts` for what `theme` provides.

For registration, read the changed game's `game.ts` export and compare its `id` with its folder name.

For scores, follow every path by which a round ends and check that each calls `recordScore` once, with `game.id`. Look for direct use of `localStorage` or a module-level score table.

For theme, read each colour, font and size passed to the canvas, including those inside helper functions in the game's folder, and check where the value comes from.

## Threshold

Report a change under `src/games/` that breaks one of the three rules. State the consequence accurately: a game without a default export in `game.ts`, or whose `id` differs from its folder name, makes `src/games/index.ts` throw when it loads, so the carnival does not start. The registry tests catch both, so report them only when a change would slip past those tests. A game that records a score twice, or on a path that never ends a round, changes what the shared score table shows.

Do not report:

- Code outside `src/games/`. `src/carnival/` defines the theme and scores, and `src/midway/palette.ts` has its own scenery colours.
- Values derived from the theme, such as a `theme` colour with an alpha added, or a size computed from a `theme` size.
- Test data in `game.test.ts`.
- Anything lint, the type-checker or the tests already enforce.
- Rules 4 to 7 in `AGENTS.md`.

## Reporting

- Name the rule by its number and quote the line that breaks it.
- Say what the player or the midway sees as a result, and no more than the code supports.
- State the fix: the `theme` key or `canvasFont` call to use, the `recordScore` call to add or remove, or the export or `id` to correct. If the theme has no suitable value, say that the theme needs a change in its own pull request, rather than suggesting a literal.
