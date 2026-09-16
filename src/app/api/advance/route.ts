import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ROUNDS, TIEBREAK_QUESTIONS } from "@/content/rounds";
import { SHOP_AFTER_ROUNDS, MAX_QUESTION_POINTS } from "@/types/game";
import { autoPlayBotsForQuestion, autoPlayBotsFinalVote } from "@/lib/answering";

type Action =
  | "start_questions"
  | "reveal"
  | "next"
  | "close_shop"
  | "start_tiebreak"
  | "start_final_vote"
  | "finish";

export async function POST(req: Request) {
  const body = await req.json();
  const { roomId, action } = body as { roomId: string; action: Action; tiebreakPlayerIds?: string[] };
  if (!roomId || !action) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const rooms = await sql`select * from rooms where id = ${roomId}`;
  if (rooms.length === 0) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  const room = rooms[0];

  function questionRoom(currentRound: number, currentQuestion: number) {
    return {
      id: roomId,
      phase: "question",
      current_round: currentRound,
      current_question: currentQuestion,
      question_started_at: new Date().toISOString(),
      tiebreak_player_ids: room.tiebreak_player_ids,
    };
  }

  switch (action) {
    case "start_questions": {
      await sql`
        update rooms set phase = 'question', current_round = 0, current_question = 0,
          question_started_at = now()
        where id = ${roomId}
      `;
      await autoPlayBotsForQuestion(sql, questionRoom(0, 0));
      break;
    }
    case "reveal": {
      const isTiebreak = room.current_round === -1;
      const roundType = isTiebreak ? "who-said-it" : ROUNDS[room.current_round]?.type;

      if (roundType === "most-likely") {
        await sql.begin(async (tx) => {
          const rows = await tx`
            select choice_player_id, count(*) as votes from answers
            where room_id = ${roomId} and round_index = ${room.current_round}
              and question_index = ${room.current_question} and choice_player_id is not null
            group by choice_player_id
            order by votes desc
          `;
          if (rows.length > 0) {
            const majorityId = rows[0].choice_player_id;
            await tx`
              update answers set is_correct = true, points_awarded = ${MAX_QUESTION_POINTS}
              where room_id = ${roomId} and round_index = ${room.current_round}
                and question_index = ${room.current_question} and choice_player_id = ${majorityId}
            `;
            await tx`
              update players set score = score + ${MAX_QUESTION_POINTS}
              where id in (
                select player_id from answers
                where room_id = ${roomId} and round_index = ${room.current_round}
                  and question_index = ${room.current_question} and choice_player_id = ${majorityId}
              )
            `;
          }
          await tx`update rooms set phase = 'reveal' where id = ${roomId}`;
        });
        break;
      }

      await sql`update rooms set phase = 'reveal' where id = ${roomId}`;
      break;
    }
    case "next": {
      const isTiebreak = room.current_round === -1;
      if (isTiebreak) {
        const nextQ = room.current_question + 1;
        if (nextQ < TIEBREAK_QUESTIONS.length) {
          await sql`
            update rooms set phase = 'question', current_question = ${nextQ}, question_started_at = now()
            where id = ${roomId}
          `;
          await autoPlayBotsForQuestion(sql, questionRoom(-1, nextQ));
        } else {
          await sql`update rooms set phase = 'final_vote' where id = ${roomId}`;
          await autoPlayBotsFinalVote(sql, roomId);
        }
        break;
      }

      const round = ROUNDS[room.current_round];
      const nextQ = room.current_question + 1;
      if (nextQ < round.questions.length) {
        await sql`
          update rooms set phase = 'question', current_question = ${nextQ}, question_started_at = now()
          where id = ${roomId}
        `;
        await autoPlayBotsForQuestion(sql, questionRoom(room.current_round, nextQ));
      } else if (SHOP_AFTER_ROUNDS.has(room.current_round)) {
        await sql`update rooms set phase = 'shop' where id = ${roomId}`;
      } else if (room.current_round + 1 < ROUNDS.length) {
        await sql`
          update rooms set phase = 'question', current_round = ${room.current_round + 1},
            current_question = 0, question_started_at = now()
          where id = ${roomId}
        `;
        await autoPlayBotsForQuestion(sql, questionRoom(room.current_round + 1, 0));
      } else {
        // último round terminado: el host decide manualmente si hay desempate
        await sql`update rooms set phase = 'reveal' where id = ${roomId}`;
      }
      break;
    }
    case "close_shop": {
      await sql`
        update rooms set phase = 'question', current_round = ${room.current_round + 1},
          current_question = 0, question_started_at = now()
        where id = ${roomId}
      `;
      await autoPlayBotsForQuestion(sql, questionRoom(room.current_round + 1, 0));
      break;
    }
    case "start_tiebreak": {
      const ids = body.tiebreakPlayerIds ?? [];
      await sql`
        update rooms set phase = 'question', current_round = -1, current_question = 0,
          question_started_at = now(), tiebreak_player_ids = ${sql.array(ids)}::uuid[]
        where id = ${roomId}
      `;
      await autoPlayBotsForQuestion(sql, { ...questionRoom(-1, 0), tiebreak_player_ids: ids });
      break;
    }
    case "start_final_vote": {
      await sql`update rooms set phase = 'final_vote' where id = ${roomId}`;
      await autoPlayBotsFinalVote(sql, roomId);
      break;
    }
    case "finish": {
      await sql.begin(async (tx) => {
        const infiltradoId = room.infiltrado_player_id;
        if (infiltradoId) {
          const votes = await tx`select * from final_votes where room_id = ${roomId}`;
          // El propio voto del infiltrado (para disimular) no cuenta como acusación incorrecta recibida.
          const wrongVotes = votes.filter((v) => v.suspect_id !== infiltradoId && v.voter_id !== infiltradoId);
          if (wrongVotes.length > 0) {
            await tx`
              update players set infiltrado_points = infiltrado_points + ${300 * wrongVotes.length}
              where id = ${infiltradoId}
            `;
          }

          const tally = new Map<string, number>();
          for (const v of votes) {
            tally.set(v.suspect_id, (tally.get(v.suspect_id) ?? 0) + 1);
          }
          let topSuspect: string | null = null;
          let topCount = 0;
          for (const [suspect, count] of tally) {
            if (count > topCount) {
              topSuspect = suspect;
              topCount = count;
            }
          }
          const discovered = topSuspect === infiltradoId && votes.length > 0;
          await tx`
            update players set infiltrado_points = infiltrado_points + ${discovered ? -500 : 500}
            where id = ${infiltradoId}
          `;
        }
        await tx`update rooms set phase = 'results', status = 'finished' where id = ${roomId}`;
      });
      break;
    }
    default:
      return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
