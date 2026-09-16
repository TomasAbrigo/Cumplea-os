import "server-only";
import type { sql as sqlType } from "./db";
import { ROUNDS, TIEBREAK_QUESTIONS, ChoiceQuestion } from "@/content/rounds";
import { computePoints } from "./scoring";

export interface RoomRow {
  id: string;
  phase: string;
  current_round: number;
  current_question: number;
  question_started_at: string;
  tiebreak_player_ids: string[];
}

export function getActiveQuestion(room: RoomRow) {
  const isTiebreak = room.current_round === -1;
  const question = isTiebreak
    ? TIEBREAK_QUESTIONS[room.current_question]
    : ROUNDS[room.current_round]?.questions[room.current_question];
  const roundType = isTiebreak ? "who-said-it" : ROUNDS[room.current_round]?.type;
  return { isTiebreak, question, roundType };
}

/**
 * Inserta una respuesta y aplica puntaje/poderes. Usado tanto por el jugador real
 * (vía /api/answer) como por el auto-play de los bots de testeo.
 */
export async function submitAnswer(
  sql: typeof sqlType,
  room: RoomRow,
  playerId: string,
  choice: number | null,
  choicePlayerId: string | null
) {
  const { isTiebreak, question, roundType } = getActiveQuestion(room);
  if (!question) throw new Error("Pregunta inválida");
  if (isTiebreak && !room.tiebreak_player_ids?.includes(playerId)) {
    throw new Error("No participás del desempate");
  }

  const startedAt = new Date(room.question_started_at).getTime();
  const responseMs = Date.now() - startedAt;

  let isCorrect = false;
  let points = 0;

  const result = await sql.begin(async (tx) => {
    if (roundType === "most-likely") {
      const inserted = await tx`
        insert into answers (room_id, player_id, round_index, question_index, choice_player_id, response_ms)
        values (${room.id}, ${playerId}, ${room.current_round}, ${room.current_question}, ${choicePlayerId}, ${responseMs})
        on conflict (player_id, round_index, question_index) do nothing
        returning *
      `;
      return inserted[0] ?? null;
    }

    const choiceQuestion = question as ChoiceQuestion;
    isCorrect = choice === choiceQuestion.correctIndex;
    points = computePoints(isCorrect, responseMs);

    if (isCorrect) {
      const dup = await tx`
        select * from power_uses
        where player_id = ${playerId} and power_type = 'duplicador' and consumed = false
        order by used_at asc limit 1
      `;
      if (dup.length > 0) {
        points *= 2;
        await tx`update power_uses set consumed = true where id = ${dup[0].id}`;
      }
    }

    const bomb = await tx`
      select * from power_uses
      where target_player_id = ${playerId} and power_type = 'bomba' and consumed = false
      order by used_at asc limit 1
    `;
    if (bomb.length > 0) {
      points = Math.round(points / 2);
      await tx`update power_uses set consumed = true where id = ${bomb[0].id}`;
    }

    const inserted = await tx`
      insert into answers (room_id, player_id, round_index, question_index, choice, is_correct, points_awarded, response_ms)
      values (${room.id}, ${playerId}, ${room.current_round}, ${room.current_question}, ${choice}, ${isCorrect}, ${points}, ${responseMs})
      on conflict (player_id, round_index, question_index) do nothing
      returning *
    `;
    if (inserted[0] && points !== 0) {
      await tx`update players set score = score + ${points} where id = ${playerId}`;
    }
    return inserted[0] ?? null;
  });

  return { inserted: result, isCorrect, points };
}

/**
 * Hace que todos los bots de la sala respondan la pregunta actual al azar,
 * con un tiempo de respuesta simulado. No falla si algo sale mal con un bot
 * puntual: el testeo no debe romperse por eso.
 */
export async function autoPlayBotsForQuestion(sql: typeof sqlType, room: RoomRow) {
  const bots = await sql`select * from players where room_id = ${room.id} and is_bot = true`;
  if (bots.length === 0) return;

  const { question, roundType } = getActiveQuestion(room);
  if (!question) return;

  for (const bot of bots) {
    const simulatedMs = 1500 + Math.floor(Math.random() * 20000);
    const fakeRoom = {
      ...room,
      question_started_at: new Date(Date.now() - simulatedMs).toISOString(),
    };
    try {
      if (roundType === "most-likely") {
        const allPlayers = await sql`select id from players where room_id = ${room.id}`;
        const target = allPlayers[Math.floor(Math.random() * allPlayers.length)];
        await submitAnswer(sql, fakeRoom, bot.id, null, target?.id ?? null);
      } else {
        const options = (question as ChoiceQuestion).options;
        const choice = Math.floor(Math.random() * options.length);
        await submitAnswer(sql, fakeRoom, bot.id, choice, null);
      }
    } catch {
      // un bot fallando no debe frenar el testeo
    }
  }
}

/** Hace votar a todos los bots en la acusación final, al azar (nunca a sí mismos). */
export async function autoPlayBotsFinalVote(sql: typeof sqlType, roomId: string) {
  const players = await sql`select id, is_bot from players where room_id = ${roomId}`;
  const bots = players.filter((p) => p.is_bot);
  if (bots.length === 0) return;

  for (const bot of bots) {
    const others = players.filter((p) => p.id !== bot.id);
    if (others.length === 0) continue;
    const suspect = others[Math.floor(Math.random() * others.length)];
    try {
      await sql`
        insert into final_votes (room_id, voter_id, suspect_id)
        values (${roomId}, ${bot.id}, ${suspect.id})
        on conflict (voter_id) do nothing
      `;
    } catch {
      // ignorar
    }
  }
}
