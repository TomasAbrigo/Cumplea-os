import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { MISSION_TEMPLATES, resolveMissionText } from "@/content/missions";

export async function POST(req: Request) {
  const { roomId } = await req.json();
  if (!roomId) return NextResponse.json({ error: "Falta roomId" }, { status: 400 });

  const players = await sql`select * from players where room_id = ${roomId} order by joined_at asc`;
  if (players.length < 1) {
    return NextResponse.json({ error: "Hace falta al menos 1 jugador para arrancar" }, { status: 400 });
  }

  // El infiltrado siempre recae en una persona real cuando hay alguna
  // (un bot de testeo no puede cumplir misiones, así que no tiene sentido elegirlo).
  const humanPlayers = players.filter((p) => !p.is_bot);
  const pool = humanPlayers.length > 0 ? humanPlayers : players;
  const infiltrado = pool[Math.floor(Math.random() * pool.length)];
  const others = players.filter((p) => p.id !== infiltrado.id);

  await sql.begin(async (tx) => {
    await tx`
      update rooms
      set status = 'playing', phase = 'roles', infiltrado_player_id = ${infiltrado.id}
      where id = ${roomId}
    `;
    await tx`update players set is_infiltrado = true where id = ${infiltrado.id}`;

    for (let i = 0; i < MISSION_TEMPLATES.length; i++) {
      const template = MISSION_TEMPLATES[i];
      const target = others[Math.floor(Math.random() * others.length)];
      const text = template.needsTarget
        ? resolveMissionText(template.text, target?.name ?? "alguien")
        : template.text;
      await tx`
        insert into mission_progress (room_id, player_id, mission_index, mission_key, resolved_text)
        values (${roomId}, ${infiltrado.id}, ${i}, ${template.key}, ${text})
      `;
    }
  });

  return NextResponse.json({ ok: true });
}
