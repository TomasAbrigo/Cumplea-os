import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  const { roomId, name } = await req.json();
  if (!roomId || !name || typeof name !== "string") {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }
  const trimmed = name.trim().slice(0, 24);
  if (!trimmed) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }

  const rooms = await sql`select * from rooms where id = ${roomId}`;
  if (rooms.length === 0) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  }

  // Reingreso: si ya existe un jugador con ese nombre en la sala, lo devolvemos
  // (permite reconectarse desde el celular sin duplicar el registro).
  const existing = await sql`
    select * from players where room_id = ${roomId} and name = ${trimmed}
  `;
  if (existing.length > 0) {
    return NextResponse.json({ player: existing[0] });
  }

  if (rooms[0].status !== "lobby") {
    return NextResponse.json(
      { error: "La partida ya arrancó, no se pueden sumar jugadores nuevos" },
      { status: 409 }
    );
  }

  const inserted = await sql`
    insert into players (room_id, name) values (${roomId}, ${trimmed})
    returning *
  `;
  return NextResponse.json({ player: inserted[0] });
}
