import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { MISSION_TEMPLATES, resolveMissionText } from "@/content/missions";

export async function POST(req: Request) {
  const { roomId } = await req.json();
  if (!roomId) return NextResponse.json({ error: "Falta roomId" }, { status: 400 });

  const players = await sql`select * from players where room_id = ${roomId} order by joined_at asc`;
  if (players.length < 3) {
    return NextResponse.json(
      { error: "Hacen falta al menos 3 jugadores para arrancar" },
      { status: 400 }
    );
  }

  const infiltrado = players[Math.floor(Math.random() * players.length)];
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
