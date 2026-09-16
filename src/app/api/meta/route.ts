import { NextResponse } from "next/server";
import { ROUNDS, TIEBREAK_QUESTIONS } from "@/content/rounds";

// Metadata sin respuestas correctas: seguro de exponer al cliente.
export async function GET() {
  return NextResponse.json({
    rounds: ROUNDS.map((r) => ({
      index: r.index,
      key: r.key,
      title: r.title,
      subtitle: r.subtitle,
      type: r.type,
      count: r.questions.length,
    })),
    tiebreakCount: TIEBREAK_QUESTIONS.length,
  });
}
