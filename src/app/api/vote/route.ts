import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  const { roomId, voterId, suspectId } = await req.json();
  if (!roomId || !voterId || !suspectId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }
  try {
    await sql`
      insert into final_votes (room_id, voter_id, suspect_id)
      values (${roomId}, ${voterId}, ${suspectId})
    `;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("duplicate key")) {
      return NextResponse.json({ error: "Ya votaste" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
