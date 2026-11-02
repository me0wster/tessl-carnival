import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const ROUND_SECONDS = 30;
export const COLUMNS = 3;
export const ROWS = 3;
export const HOLE_RADIUS = 48;
export const POINTS_PER_WHACK = 10;
/** Seconds between pop-ups at the start and at the end of the round. */
export const START_INTERVAL = 1;
export const END_INTERVAL = 0.35;
/** Seconds a mole stays up at the start and at the end of the round. */
export const START_UP_TIME = 1.2;
export const END_UP_TIME = 0.5;

const GRID_TOP = 120;
const GRID_BOTTOM = HEIGHT - 40;

export interface Hole {
  x: number;
  y: number;
  /** Seconds left before the mole drops back down; 0 when the hole is empty. */
  up: number;
}

export interface WhackAMoleState {
  holes: Hole[];
  /** Seconds left in the round. */
  timeLeft: number;
  /** Seconds until the next mole pops up. */
  nextPopIn: number;
  score: number;
  phase: 'playing' | 'over';
}

export function createState(): WhackAMoleState {
  const holes: Hole[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      holes.push({
        x: (WIDTH / COLUMNS) * (col + 0.5),
        y: GRID_TOP + ((GRID_BOTTOM - GRID_TOP) / ROWS) * (row + 0.5),
        up: 0,
      });
    }
  }
  return { holes, timeLeft: ROUND_SECONDS, nextPopIn: START_INTERVAL, score: 0, phase: 'playing' };
}

/** How far through the round we are, from 0 to 1. */
function progress(state: WhackAMoleState): number {
  return 1 - state.timeLeft / ROUND_SECONDS;
}

/** Seconds between pop-ups: shrinks as the round goes on. */
export function popInterval(state: WhackAMoleState): number {
  return START_INTERVAL + (END_INTERVAL - START_INTERVAL) * progress(state);
}

/** Seconds a new mole stays up: shrinks as the round goes on. */
export function upTime(state: WhackAMoleState): number {
  return START_UP_TIME + (END_UP_TIME - START_UP_TIME) * progress(state);
}

/** Pops a mole out of a random empty hole. Returns false if every hole is taken. */
export function popMole(state: WhackAMoleState, random: () => number = Math.random): boolean {
  const empty = state.holes.filter((hole) => hole.up <= 0);
  if (empty.length === 0) return false;
  empty[Math.min(Math.floor(random() * empty.length), empty.length - 1)].up = upTime(state);
  return true;
}

/** Whacks the mole under the point, if there is one. Returns true on a hit. */
export function whack(state: WhackAMoleState, x: number, y: number): boolean {
  if (state.phase !== 'playing') return false;
  const hole = state.holes.find((h) => h.up > 0 && Math.hypot(x - h.x, y - h.y) <= HOLE_RADIUS);
  if (!hole) return false;
  hole.up = 0;
  state.score += POINTS_PER_WHACK;
  return true;
}

/** Advances the game by `dt` seconds. */
export function step(state: WhackAMoleState, dt: number, random: () => number = Math.random) {
  if (state.phase !== 'playing') return;

  state.timeLeft = Math.max(0, state.timeLeft - dt);
  for (const hole of state.holes) hole.up = Math.max(0, hole.up - dt);

  state.nextPopIn -= dt;
  while (state.nextPopIn <= 0 && state.timeLeft > 0) {
    popMole(state, random);
    state.nextPopIn += popInterval(state);
  }

  if (state.timeLeft === 0) {
    for (const hole of state.holes) hole.up = 0;
    state.phase = 'over';
  }
}

function draw(ctx: CanvasRenderingContext2D, state: WhackAMoleState) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Booth awning.
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }

  for (const hole of state.holes) {
    ctx.fillStyle = colors.surface;
    ctx.beginPath();
    ctx.ellipse(hole.x, hole.y + 20, HOLE_RADIUS, HOLE_RADIUS * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    if (hole.up > 0) {
      ctx.fillStyle = colors.wood;
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, HOLE_RADIUS * 0.7, Math.PI, 0);
      ctx.lineTo(hole.x + HOLE_RADIUS * 0.7, hole.y + 20);
      ctx.lineTo(hole.x - HOLE_RADIUS * 0.7, hole.y + 20);
      ctx.fill();
      ctx.fillStyle = colors.text;
      ctx.beginPath();
      ctx.arc(hole.x - 14, hole.y - 12, 6, 0, Math.PI * 2);
      ctx.arc(hole.x + 14, hole.y - 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.danger;
      ctx.beginPath();
      ctx.arc(hole.x, hole.y + 2, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    // The front lip of the hole hides the mole's base.
    ctx.fillStyle = colors.surface;
    ctx.fillRect(hole.x - HOLE_RADIUS, hole.y + 20, HOLE_RADIUS * 2, 10);
  }

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, 78);
  ctx.textAlign = 'right';
  ctx.fillText(`Time ${Math.ceil(state.timeLeft)}`, WIDTH - 16, 78);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Time's up! Score ${state.score}`, WIDTH / 2, HEIGHT / 2 - 10);
    ctx.fillStyle = colors.muted;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 30);
  }
}

export const whackAMole: CarnivalGame = {
  id: 'whack-a-mole',
  name: 'Whack-a-Mole',
  description: 'Whack the moles as they pop up, and quick: they get faster.',
  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;

    const onDown = (event: PointerEvent) => {
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      whack(
        state,
        ((event.clientX - rect.left) / rect.width) * WIDTH,
        ((event.clientY - rect.top) / rect.height) * HEIGHT,
      );
    };
    canvas.addEventListener('pointerdown', onDown);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't skip the round.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(whackAMole.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};

export default whackAMole;
