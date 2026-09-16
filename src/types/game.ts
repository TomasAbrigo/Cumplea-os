export type Phase =
  | "lobby"
  | "roles"
  | "question"
  | "reveal"
  | "shop"
  | "tiebreak"
  | "final_vote"
  | "results";

export type PowerType = "duplicador" | "escudo" | "robo" | "pista" | "bomba";

export interface Room {
  id: string;
  status: "lobby" | "playing" | "finished";
  phase: Phase;
  current_round: number;
  current_question: number;
  question_started_at: string | null;
  infiltrado_player_id: string | null;
  tiebreak_player_ids: string[];
  created_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  name: string;
  score: number;
  infiltrado_points: number;
  is_infiltrado: boolean;
  is_bot: boolean;
  joined_at: string;
}

export interface Answer {
  id: string;
  room_id: string;
  player_id: string;
  round_index: number;
  question_index: number;
  choice: number | null;
  choice_player_id: string | null;
  is_correct: boolean;
  points_awarded: number;
  response_ms: number;
  answered_at: string;
}

export interface PowerUse {
  id: string;
  room_id: string;
  player_id: string;
  power_type: PowerType;
  target_player_id: string | null;
  used_at: string;
  consumed: boolean;
}

export interface MissionProgress {
  id: string;
  room_id: string;
  player_id: string;
  mission_index: number;
  mission_key: string;
  resolved_text: string;
  completed_at: string | null;
}

export interface FinalVote {
  id: string;
  room_id: string;
  voter_id: string;
  suspect_id: string;
  created_at: string;
}

export const POWER_COSTS: Record<PowerType, number> = {
  duplicador: 300,
  escudo: 250,
  robo: 400,
  pista: 150,
  bomba: 500,
};

export const QUESTION_DURATION_MS = 45_000;
export const MAX_QUESTION_POINTS = 500;
export const MIN_CORRECT_POINTS = 100;
export const ROBO_AMOUNT = 150;

/** Rounds después de los cuales se abre la tienda (0-indexed, tras terminar ese round). */
export const SHOP_AFTER_ROUNDS = new Set([0, 2]);
