import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ROUNDS, TIEBREAK_QUESTIONS, ChoiceQuestion } from "@/content/rounds";
import { computePoints } from "@/lib/scoring";

export async function POST(req: Request) {
  const { roomId, playerId, choice, choicePlayerId } = await req.json();
  if (!roomId || !playerId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const rooms = await sql`select * from rooms where id = ${roomId}`;
  if (rooms.length === 0) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  const room = rooms[0];

  if (room.phase !== "question") {
    return NextResponse.json({ error: "No se está preguntando ahora" }, { status: 409 });
  }

  const isTiebreak = room.current_round === -1;
  const question = isTiebreak
    ? TIEBREAK_QUESTIONS[room.current_question]
    : ROUNDS[room.current_round]?.questions[room.current_question];
  if (!question) return NextResponse.json({ error: "Pregunta inválida" }, { status: 400 });

  if (isTiebreak && !room.tiebreak_player_ids?.includes(playerId)) {
    return NextResponse.json({ error: "No participás del desempate" }, { status: 403 });
  }

  const roundType = isTiebreak ? "who-said-it" : ROUNDS[room.current_round].type;
  const startedAt = new Date(room.question_started_at).getTime();
  const responseMs = Date.now() - startedAt;

  let isCorrect = false;
  let points = 0;

  const result = await sql.begin(async (tx) => {
    if (roundType === "most-likely") {
      // Se define correcto recién en el reveal (por mayoría). Guardamos el voto.
      const inserted = await tx`
        insert into answers (room_id, player_id, round_index, question_index, choice_player_id, response_ms)
        values (${roomId}, ${playerId}, ${room.current_round}, ${room.current_question}, ${choicePlayerId}, ${responseMs})
        on conflict (player_id, round_index, question_index) do nothing
        returning *
      `;
      return inserted[0] ?? null;
    }

    const choiceQuestion = question as ChoiceQuestion;
    isCorrect = choice === choiceQuestion.correctIndex;
    points = computePoints(isCorrect, responseMs);

    // Duplicador activo del propio jugador
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

    // Bomba activa contra este jugador: su próxima pregunta vale la mitad
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
      values (${roomId}, ${playerId}, ${room.current_round}, ${room.current_question}, ${choice}, ${isCorrect}, ${points}, ${responseMs})
      on conflict (player_id, round_index, question_index) do nothing
      returning *
    `;
    if (inserted[0] && points !== 0) {
      await tx`update players set score = score + ${points} where id = ${playerId}`;
    }
    return inserted[0] ?? null;
  });

  if (!result) {
    return NextResponse.json({ error: "Ya habías respondido esta pregunta" }, { status: 409 });
  }

  return NextResponse.json({ isCorrect, points });
}
