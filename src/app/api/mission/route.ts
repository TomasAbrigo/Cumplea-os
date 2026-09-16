import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  const { playerId, missionIndex } = await req.json();
  if (!playerId || missionIndex === undefined) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const updated = await sql`
    update mission_progress
    set completed_at = now()
    where player_id = ${playerId} and mission_index = ${missionIndex} and completed_at is null
    returning *
  `;
  if (updated.length > 0) {
    await sql`update players set infiltrado_points = infiltrado_points + 200 where id = ${playerId}`;
  }

  return NextResponse.json({ ok: true, completed: updated.length > 0 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  if (!playerId) return NextResponse.json({ error: "Falta playerId" }, { status: 400 });
  const missions = await sql`
    select * from mission_progress where player_id = ${playerId} order by mission_index asc
  `;
  return NextResponse.json({ missions });
}
