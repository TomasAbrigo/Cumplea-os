import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

const BOT_NAMES = ["Bot Uno", "Bot Dos", "Bot Tres", "Bot Cuatro", "Bot Cinco", "Bot Seis"];

export async function POST(req: Request) {
  const { roomId, count } = await req.json();
  if (!roomId) return NextResponse.json({ error: "Falta roomId" }, { status: 400 });

  const rooms = await sql`select * from rooms where id = ${roomId}`;
  if (rooms.length === 0) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  if (rooms[0].status !== "lobby") {
    return NextResponse.json({ error: "La partida ya arrancó" }, { status: 409 });
  }

  const existing = await sql`select name from players where room_id = ${roomId} and is_bot = true`;
  const usedNames = new Set(existing.map((p) => p.name));
  const available = BOT_NAMES.filter((n) => !usedNames.has(n));

  const toAdd = available.slice(0, Math.min(count ?? 2, available.length));
  const inserted = [];
  for (const name of toAdd) {
    const row = await sql`
      insert into players (room_id, name, is_bot) values (${roomId}, ${name}, true)
      returning *
    `;
    inserted.push(row[0]);
  }

  return NextResponse.json({ added: inserted });
}
