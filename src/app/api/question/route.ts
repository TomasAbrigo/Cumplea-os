import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ROUNDS, TIEBREAK_QUESTIONS, ChoiceQuestion, MostLikelyQuestion } from "@/content/rounds";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ error: "Falta roomId" }, { status: 400 });

  const rooms = await sql`select * from rooms where id = ${roomId}`;
  if (rooms.length === 0) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  const room = rooms[0];

  const isTiebreak = room.current_round === -1;
  const round = isTiebreak ? null : ROUNDS[room.current_round];
  const question = isTiebreak ? TIEBREAK_QUESTIONS[room.current_question] : round?.questions[room.current_question];

  if (!question) {
    return NextResponse.json({ error: "No hay pregunta activa" }, { status: 404 });
  }

  const isChoice = "options" in question;
  const revealPhase = room.phase === "reveal";

  const base = {
    roundTitle: isTiebreak ? "Desempate" : round!.title,
    roundType: isTiebreak ? "who-said-it" : round!.type,
    prompt: question.prompt,
  };

  if (isChoice) {
    const q = question as ChoiceQuestion;
    return NextResponse.json({
      ...base,
      detail: q.detail ?? null,
      imageUrl: q.imageUrl ?? null,
      options: q.options,
      correctIndex: revealPhase ? q.correctIndex : null,
    });
  }

  const q = question as MostLikelyQuestion;
  return NextResponse.json({ ...base, prompt: q.prompt });
}
