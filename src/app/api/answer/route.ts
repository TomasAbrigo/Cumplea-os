import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { submitAnswer, RoomRow } from "@/lib/answering";

export async function POST(req: Request) {
  const { roomId, playerId, choice, choicePlayerId } = await req.json();
  if (!roomId || !playerId) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const rooms = await sql`select * from rooms where id = ${roomId}`;
  if (rooms.length === 0) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  const room = rooms[0];

  if (room.phase !== "question") {
    return NextResponse.json({ error: "No se está preguntando ahora" }, { status: 409 });
  }

  let result;
  try {
    result = await submitAnswer(sql, room as unknown as RoomRow, playerId, choice ?? null, choicePlayerId ?? null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!result.inserted) {
    return NextResponse.json({ error: "Ya habías respondido esta pregunta" }, { status: 409 });
  }

  return NextResponse.json({ isCorrect: result.isCorrect, points: result.points });
}
