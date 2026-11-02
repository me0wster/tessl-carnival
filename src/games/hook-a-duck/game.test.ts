import { describe, expect, it } from 'vitest';
import { CASTS, CAST_TIME, DUCK_VALUES, cast, createState, duckUnderHook, step } from './game';

describe('hook a duck', () => {
  it('starts with every cast left and no score', () => {
    const state = createState();
    expect(state.casts).toBe(CASTS);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.ducks.map((d) => d.value)).toEqual([...DUCK_VALUES]);
  });

  it('uses one cast per lowering and allows only one at a time', () => {
    const state = createState();
    expect(cast(state, 100)).toBe(true);
    expect(cast(state, 100)).toBe(false);
    expect(state.casts).toBe(CASTS - 1);
  });

  it('scores the number on the base of the duck under the hook', () => {
    const state = createState();
    state.ducks = [{ x: 300, y: 300, radius: 24, speed: 0, value: 50 }];
    cast(state, 310);
    step(state, CAST_TIME);
    expect(state.score).toBe(50);
    expect(state.lastCatch).toBe(50);
    expect(state.hook).toBeNull();
    expect(state.ducks[0].x).toBeLessThan(0);
  });

  it('scores nothing when the hook comes down on empty water', () => {
    const state = createState();
    state.ducks = [{ x: 600, y: 300, radius: 24, speed: 0, value: 50 }];
    cast(state, 100);
    step(state, CAST_TIME);
    expect(state.score).toBe(0);
    expect(state.lastCatch).toBeNull();
  });

  it('catches the nearest duck when two are under the hook', () => {
    const state = createState();
    state.ducks = [
      { x: 290, y: 300, radius: 24, speed: 0, value: 5 },
      { x: 305, y: 300, radius: 24, speed: 0, value: 20 },
    ];
    expect(duckUnderHook(state, 300)?.value).toBe(20);
  });

  it('floats ducks round the stream in a loop', () => {
    const state = createState();
    state.ducks = [{ x: 815, y: 300, radius: 24, speed: 100, value: 10 }];
    step(state, 0.1);
    expect(state.ducks[0].x).toBeLessThan(0);
  });

  it('ends the round once the last cast has come down', () => {
    const state = createState();
    state.casts = 1;
    cast(state, 100);
    step(state, CAST_TIME / 2);
    expect(state.phase).toBe('playing');
    step(state, CAST_TIME);
    expect(state.phase).toBe('over');
    expect(cast(state, 100)).toBe(false);
  });
});
