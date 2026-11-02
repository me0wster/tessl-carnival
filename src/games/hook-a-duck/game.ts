import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const CASTS = 8;
export const CAST_TIME = 0.5;
export const HOOK_RADIUS = 26;
export const STREAM = { y: 270, height: 110 } as const;
const DUCK_RADIUS = 24;
const DUCK_SPEED = 90;
/** The number on each duck's base, in the order they float round the stream. */
export const DUCK_VALUES = [10, 5, 20, 5, 50, 10, 20, 5] as const;

export interface Duck {
  x: number;
  y: number;
  radius: number;
  /** Pixels per second, always to the right. */
  speed: number;
  /** The number on the duck's base: what it scores. */
  value: number;
}

export interface Hook {
  x: number;
  /** Seconds since the hook was lowered. */
  age: number;
}

export interface Splash {
  x: number;
  y: number;
  age: number;
}

export interface HookADuckState {
  ducks: Duck[];
  hook: Hook | null;
  splashes: Splash[];
  casts: number;
  score: number;
  /** The value of the last duck caught, or null if the last cast missed. */
  lastCatch: number | null;
  phase: 'playing' | 'over';
}

export function createState(): HookADuckState {
  const spacing = WIDTH / DUCK_VALUES.length;
  const ducks = DUCK_VALUES.map((value, i) => ({
    x: spacing * i + spacing / 2,
    y: STREAM.y + STREAM.height / 2,
    radius: DUCK_RADIUS,
    speed: DUCK_SPEED,
    value,
  }));
  return {
    ducks,
    hook: null,
    splashes: [],
    casts: CASTS,
    score: 0,
    lastCatch: null,
    phase: 'playing',
  };
}

/** The duck under the hook, if any. The nearest one wins when two overlap. */
export function duckUnderHook(state: HookADuckState, x: number): Duck | undefined {
  const near = state.ducks.filter((d) => Math.abs(d.x - x) <= HOOK_RADIUS);
  near.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x));
  return near[0];
}

/** Lowers the hook at `x`. Returns false if a cast is already underway or none are left. */
export function cast(state: HookADuckState, x: number): boolean {
  if (state.phase !== 'playing' || state.hook || state.casts === 0) return false;
  state.hook = { x: Math.max(0, Math.min(WIDTH, x)), age: 0 };
  state.casts -= 1;
  return true;
}

/** Advances the game by `dt` seconds. */
export function step(state: HookADuckState, dt: number): void {
  for (const duck of state.ducks) {
    duck.x += duck.speed * dt;
    if (duck.x > WIDTH + duck.radius) duck.x = -duck.radius;
  }

  if (state.hook) {
    state.hook.age += dt;
    if (state.hook.age >= CAST_TIME) {
      const duck = duckUnderHook(state, state.hook.x);
      if (duck) {
        state.score += duck.value;
        state.lastCatch = duck.value;
        state.splashes.push({ x: duck.x, y: duck.y, age: 0 });
        // The caught duck goes back to the start of the stream.
        duck.x = -duck.radius;
      } else {
        state.lastCatch = null;
        state.splashes.push({ x: state.hook.x, y: STREAM.y + STREAM.height / 2, age: 0 });
      }
      state.hook = null;
    }
  }

  for (const splash of state.splashes) splash.age += dt;
  state.splashes = state.splashes.filter((s) => s.age < 0.4);

  if (state.casts === 0 && !state.hook) state.phase = 'over';
}

function draw(ctx: CanvasRenderingContext2D, state: HookADuckState, aimX: number) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Booth awning.
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }

  // The stream.
  ctx.fillStyle = colors.water;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(0, STREAM.y, WIDTH, STREAM.height);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.wood;
  ctx.fillRect(0, STREAM.y + STREAM.height, WIDTH, 8);

  for (const duck of state.ducks) {
    // Base with the number on it.
    ctx.fillStyle = colors.stripeA;
    ctx.fillRect(duck.x - duck.radius, duck.y + 6, duck.radius * 2, 18);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('small', 'bold');
    ctx.textAlign = 'center';
    ctx.fillText(String(duck.value), duck.x, duck.y + 20);
    // Body and head.
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(duck.x, duck.y - 4, duck.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(duck.x + 12, duck.y - 20, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.stripeA;
    ctx.fillRect(duck.x + 19, duck.y - 22, 8, 4);
  }

  ctx.strokeStyle = colors.water;
  ctx.lineWidth = 3;
  for (const splash of state.splashes) {
    ctx.globalAlpha = 1 - splash.age / 0.4;
    ctx.beginPath();
    ctx.arc(splash.x, splash.y, 10 + splash.age * 90, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Rod and hook: the hook is lowered into the stream as the cast ages.
  const hookX = state.hook ? state.hook.x : aimX;
  const progress = state.hook ? Math.min(state.hook.age / CAST_TIME, 1) : 0;
  const hookY = 60 + progress * (STREAM.y + STREAM.height / 2 - 60);
  ctx.strokeStyle = colors.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hookX, 40);
  ctx.lineTo(hookX, hookY);
  ctx.stroke();
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(hookX, hookY + 8, 8, 0, Math.PI);
  ctx.stroke();

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Casts ${state.casts}/${CASTS}`, WIDTH - 16, HEIGHT - 20);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Out of casts! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const hookADuck: CarnivalGame = {
  id: 'hook-a-duck',
  name: 'Hook a Duck',
  description:
    'Lower your hook to catch a duck as it floats past. The number on its base is your score.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;
    let aimX = WIDTH / 2;

    const toCanvasX = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return ((event.clientX - rect.left) / rect.width) * WIDTH;
    };
    const onMove = (event: PointerEvent) => {
      aimX = toCanvasX(event);
    };
    const onDown = (event: PointerEvent) => {
      aimX = toCanvasX(event);
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
      } else {
        cast(state, aimX);
      }
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(hookADuck.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state, aimX);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};

export default hookADuck;
