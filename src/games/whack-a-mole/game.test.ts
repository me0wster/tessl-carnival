import { describe, expect, it } from 'vitest';
import {
  END_INTERVAL,
  END_UP_TIME,
  POINTS_PER_WHACK,
  ROUND_SECONDS,
  START_INTERVAL,
  START_UP_TIME,
  createState,
  popInterval,
  popMole,
  step,
  upTime,
  whack,
} from './game';

describe('whack-a-mole', () => {
  it('starts with empty holes, a full clock and no score', () => {
    const state = createState();
    expect(state.holes).toHaveLength(9);
    expect(state.holes.every((h) => h.up === 0)).toBe(true);
    expect(state.timeLeft).toBe(ROUND_SECONDS);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
  });

  it('pops a mole into an empty hole and never into a taken one', () => {
    const state = createState();
    for (let i = 0; i < 9; i++) expect(popMole(state, () => 0)).toBe(true);
    expect(state.holes.every((h) => h.up > 0)).toBe(true);
    expect(popMole(state)).toBe(false);
  });

  it('drops a mole back down after its time is up', () => {
    const state = createState();
    popMole(state, () => 0);
    step(state, START_UP_TIME + 0.01, () => 0.99);
    expect(state.holes[0].up).toBe(0);
  });

  it('scores a whack on a mole that is up and sends it down', () => {
    const state = createState();
    popMole(state, () => 0);
    const hole = state.holes[0];
    expect(whack(state, hole.x, hole.y)).toBe(true);
    expect(state.score).toBe(POINTS_PER_WHACK);
    expect(hole.up).toBe(0);
    expect(whack(state, hole.x, hole.y)).toBe(false);
    expect(state.score).toBe(POINTS_PER_WHACK);
  });

  it('scores nothing for a click on an empty hole or off the grid', () => {
    const state = createState();
    expect(whack(state, state.holes[0].x, state.holes[0].y)).toBe(false);
    popMole(state, () => 0);
    expect(whack(state, 0, 0)).toBe(false);
    expect(state.score).toBe(0);
  });

  it('pops moles up faster and for less time as the round goes on', () => {
    const state = createState();
    expect(popInterval(state)).toBeCloseTo(START_INTERVAL);
    expect(upTime(state)).toBeCloseTo(START_UP_TIME);
    state.timeLeft = 0;
    expect(popInterval(state)).toBeCloseTo(END_INTERVAL);
    expect(upTime(state)).toBeCloseTo(END_UP_TIME);
  });

  it('pops a mole once the first interval has passed', () => {
    const state = createState();
    step(state, START_INTERVAL + 0.01, () => 0);
    expect(state.holes.some((h) => h.up > 0)).toBe(true);
  });

  it('ends the round when the clock runs out and clears the board', () => {
    const state = createState();
    popMole(state, () => 0);
    step(state, ROUND_SECONDS + 1);
    expect(state.timeLeft).toBe(0);
    expect(state.phase).toBe('over');
    expect(state.holes.every((h) => h.up === 0)).toBe(true);
  });

  it('ignores whacks and steps after the round is over', () => {
    const state = createState();
    popMole(state, () => 0);
    const { x, y } = state.holes[0];
    state.phase = 'over';
    expect(whack(state, x, y)).toBe(false);
    step(state, 1);
    expect(state.timeLeft).toBe(ROUND_SECONDS);
  });
});
