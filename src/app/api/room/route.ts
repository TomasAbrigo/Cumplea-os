import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { generateRoomCode } from "@/lib/roomCode";

export async function POST() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    try {
      await sql`insert into rooms (id) values (${code})`;
      return NextResponse.json({ code });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (!message.includes("duplicate key")) {
        return NextResponse.json({ error: message }, { status: 500 });
      }
      // código repetido, reintentar
    }
  }
  return NextResponse.json({ error: "No se pudo generar un código de sala" }, { status: 500 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Falta code" }, { status: 400 });

  const rooms = await sql`select * from rooms where id = ${code}`;
  if (rooms.length === 0) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  }
  const players = await sql`select * from players where room_id = ${code} order by joined_at asc`;
  return NextResponse.json({ room: rooms[0], players });
}
