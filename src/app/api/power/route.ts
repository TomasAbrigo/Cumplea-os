import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ROUNDS } from "@/content/rounds";
import { POWER_COSTS, ROBO_AMOUNT, PowerType } from "@/types/game";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    roomId: string;
    playerId: string;
    power: PowerType;
    targetPlayerId?: string;
  };
  const { roomId, playerId, power } = body;
  const targetPlayerId: string | null = body.targetPlayerId ?? null;
  if (!roomId || !playerId || !power) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const cost = POWER_COSTS[power];
  if (!cost) return NextResponse.json({ error: "Poder inválido" }, { status: 400 });

  if ((power === "robo" || power === "bomba") && !targetPlayerId) {
    return NextResponse.json({ error: "Este poder necesita un objetivo" }, { status: 400 });
  }

  const rooms = await sql`select * from rooms where id = ${roomId}`;
  if (rooms.length === 0) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  const room = rooms[0];
  if (room.phase !== "shop") {
    return NextResponse.json({ error: "La tienda está cerrada" }, { status: 409 });
  }

  const players = await sql`select * from players where id = ${playerId}`;
  if (players.length === 0) return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
  const buyer = players[0];
  if (buyer.score < cost) {
    return NextResponse.json({ error: "No te alcanzan los puntos" }, { status: 400 });
  }

  let hiddenOptionIndex: number | null = null;

  await sql.begin(async (tx) => {
    await tx`update players set score = score - ${cost} where id = ${playerId}`;

    if (power === "duplicador" || power === "escudo") {
      await tx`
        insert into power_uses (room_id, player_id, power_type, consumed)
        values (${roomId}, ${playerId}, ${power}, false)
      `;
      return;
    }

    if (power === "pista") {
      const nextRound = ROUNDS[room.current_round + 1];
      const nextQuestion = nextRound?.questions[0];
      if (nextQuestion && "options" in nextQuestion) {
        const wrongIndexes = nextQuestion.options
          .map((_: string, i: number) => i)
          .filter((i: number) => i !== nextQuestion.correctIndex);
        hiddenOptionIndex = wrongIndexes[Math.floor(Math.random() * wrongIndexes.length)];
      }
      await tx`
        insert into power_uses (room_id, player_id, power_type, consumed)
        values (${roomId}, ${playerId}, ${power}, true)
      `;
      return;
    }

    // robo y bomba: chequear escudo activo del objetivo
    const shield = await tx`
      select * from power_uses
      where player_id = ${targetPlayerId} and power_type = 'escudo' and consumed = false
      order by used_at asc limit 1
    `;
    const blocked = shield.length > 0;
    if (blocked) {
      await tx`update power_uses set consumed = true where id = ${shield[0].id}`;
    }

    if (power === "robo") {
      if (!blocked) {
        await tx`update players set score = score - ${ROBO_AMOUNT} where id = ${targetPlayerId}`;
        await tx`update players set score = score + ${ROBO_AMOUNT} where id = ${playerId}`;
      }
      await tx`
        insert into power_uses (room_id, player_id, power_type, target_player_id, consumed)
        values (${roomId}, ${playerId}, ${power}, ${targetPlayerId}, true)
      `;
      return;
    }

    if (power === "bomba") {
      await tx`
        insert into power_uses (room_id, player_id, power_type, target_player_id, consumed)
        values (${roomId}, ${playerId}, ${power}, ${targetPlayerId}, ${blocked})
      `;
      return;
    }
  });

  return NextResponse.json({ ok: true, hiddenOptionIndex });
}
