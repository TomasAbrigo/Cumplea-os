import { MAX_QUESTION_POINTS, MIN_CORRECT_POINTS, QUESTION_DURATION_MS } from "@/types/game";

/** Puntaje estilo Kahoot: más rápido, más puntos. Nunca por debajo del piso si acertó. */
export function computePoints(isCorrect: boolean, responseMs: number): number {
  if (!isCorrect) return 0;
  const clamped = Math.min(Math.max(responseMs, 0), QUESTION_DURATION_MS);
  const ratio = 1 - clamped / QUESTION_DURATION_MS;
  const points = MIN_CORRECT_POINTS + ratio * (MAX_QUESTION_POINTS - MIN_CORRECT_POINTS);
  return Math.round(points);
}
