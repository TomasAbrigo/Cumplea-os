"use client";
import { useEffect, useMemo, useState } from "react";
import { useRoom } from "@/lib/useRoom";
import { useCurrentQuestion } from "@/lib/useQuestion";
import { useMeta } from "@/lib/useMeta";
import { QUESTION_DURATION_MS } from "@/types/game";

function useNow(intervalMs = 250) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

async function advance(roomId: string, action: string, extra?: Record<string, unknown>) {
  await fetch("/api/advance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, action, ...extra }),
  });
}

export default function HostView({ code }: { code: string }) {
  const { room, players, answers, votes, loading, notFound } = useRoom(code);
  const meta = useMeta();
  const question = useCurrentQuestion(room?.id, room?.phase, room?.current_round, room?.current_question);
  const now = useNow();

  const sortedByScore = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);

  const currentAnswers = useMemo(
    () =>
      room
        ? answers.filter((a) => a.round_index === room.current_round && a.question_index === room.current_question)
        : [],
    [answers, room?.current_round, room?.current_question]
  );

  const majorityName = useMemo(() => {
    if (question?.roundType !== "most-likely") return null;
    const tally = new Map<string, number>();
    for (const a of currentAnswers) {
      if (!a.choice_player_id) continue;
      tally.set(a.choice_player_id, (tally.get(a.choice_player_id) ?? 0) + 1);
    }
    let top: string | null = null;
    let topCount = 0;
    for (const [id, count] of tally) {
      if (count > topCount) {
        top = id;
        topCount = count;
      }
    }
    return players.find((p) => p.id === top)?.name ?? null;
  }, [question, currentAnswers, players]);

  if (loading) return <Centered>Cargando…</Centered>;
  if (notFound || !room) return <Centered>No existe la sala {code}</Centered>;

  const isTiebreak = room.current_round === -1;
  const lastRoundIndex = meta ? meta.rounds.length - 1 : -1;
  const lastRoundCount = meta ? meta.rounds[lastRoundIndex]?.count ?? 0 : 0;
  const isLastQuestionOverall =
    !isTiebreak && room.current_round === lastRoundIndex && room.current_question === lastRoundCount - 1;

  const answeredIds = new Set(currentAnswers.map((a) => a.player_id));
  const audience = isTiebreak ? players.filter((p) => room.tiebreak_player_ids.includes(p.id)) : players;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b border-neutral-800">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400 font-bold">
            La Noche de los 9
          </p>
          <p className="font-mono text-2xl tracking-[0.3em]">{code}</p>
        </div>
        <ol className="flex gap-4 text-sm">
          {sortedByScore.slice(0, 5).map((p, i) => (
            <li key={p.id} className="text-center">
              <div className="font-mono text-amber-400">#{i + 1}</div>
              <div className="font-bold">{p.name}</div>
              <div className="font-mono tabular-nums">{p.score}</div>
            </li>
          ))}
        </ol>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-10 py-10 gap-8">
        {room.phase === "lobby" && (
          <Lobby room={room} players={players} />
        )}
        {room.phase === "roles" && <RolesPhase room={room} />}
        {(room.phase === "question") && question && (
          <QuestionPhase
            question={question}
            room={room}
            now={now}
            answeredCount={answeredIds.size}
            total={audience.length}
            isTiebreak={isTiebreak}
          />
        )}
        {room.phase === "reveal" && question && (
          <RevealPhase
            question={question}
            majorityName={majorityName}
            sortedByScore={sortedByScore}
            room={room}
            isLastQuestionOverall={isLastQuestionOverall}
            players={players}
          />
        )}
        {room.phase === "shop" && <ShopPhase roomId={room.id} players={players} />}
        {room.phase === "final_vote" && <FinalVotePhase room={room} players={players} votes={votes} />}
        {room.phase === "results" && (
          <ResultsPhase room={room} players={players} votes={votes} />
        )}
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center text-xl">
      {children}
    </div>
  );
}

function Lobby({ room, players }: { room: { id: string }; players: { id: string; name: string; is_bot: boolean }[] }) {
  const [addingBots, setAddingBots] = useState(false);

  async function addBots() {
    setAddingBots(true);
    await fetch("/api/bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id, count: 2 }),
    });
    setAddingBots(false);
  }

  return (
    <div className="text-center space-y-8 max-w-lg">
      <div>
        <p className="text-neutral-400 mb-2">Entrá desde tu celular a esta sala</p>
        <p className="text-6xl font-mono font-black tracking-[0.2em] text-amber-400">{room.id}</p>
      </div>
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-sm uppercase tracking-widest text-neutral-400 mb-3">
          Jugadores conectados ({players.length})
        </p>
        <ul className="flex flex-wrap gap-2 justify-center">
          {players.map((p) => (
            <li key={p.id} className="rounded-full bg-neutral-800 px-4 py-1.5 font-medium">
              {p.is_bot ? "🤖 " : ""}
              {p.name}
            </li>
          ))}
          {players.length === 0 && <li className="text-neutral-500">nadie todavía…</li>}
        </ul>
      </div>
      <div className="space-y-3">
        <button
          disabled={players.length < 1}
          onClick={() => fetch("/api/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomId: room.id }) })}
          className="rounded-md bg-red-500 disabled:opacity-40 text-neutral-950 font-bold uppercase tracking-wide px-8 py-4 hover:bg-red-400"
        >
          Sortear infiltrado y arrancar
        </button>
        <div>
          <button
            onClick={addBots}
            disabled={addingBots}
            className="rounded-md border border-neutral-700 text-neutral-300 text-sm px-4 py-2 hover:border-amber-400 disabled:opacity-40"
          >
            🤖 Sumar 2 bots (para testear solo)
          </button>
        </div>
      </div>
    </div>
  );
}

function RolesPhase({ room }: { room: { id: string } }) {
  return (
    <div className="text-center space-y-6">
      <p className="text-3xl font-black uppercase">🕵️ El Infiltrado ya fue sorteado</p>
      <p className="text-neutral-400 max-w-md mx-auto">
        Cada uno toca &quot;Revelar mi rol&quot; en su celular. Cuando todos estén listos, arrancá el Round 1.
      </p>
      <button
        onClick={() => advance(room.id, "start_questions")}
        className="rounded-md bg-amber-500 text-neutral-950 font-bold uppercase tracking-wide px-8 py-4 hover:bg-amber-400"
      >
        Arrancar Round 1
      </button>
    </div>
  );
}

function QuestionPhase({
  question,
  room,
  now,
  answeredCount,
  total,
  isTiebreak,
}: {
  question: NonNullable<ReturnType<typeof useCurrentQuestion>>;
  room: { id: string; question_started_at: string | null };
  now: number;
  answeredCount: number;
  total: number;
  isTiebreak: boolean;
}) {
  const startedAt = room.question_started_at ? new Date(room.question_started_at).getTime() : now;
  const elapsed = now - startedAt;
  const remaining = Math.max(0, QUESTION_DURATION_MS - elapsed);
  const pct = Math.max(0, Math.min(100, (remaining / QUESTION_DURATION_MS) * 100));

  return (
    <div className="w-full max-w-2xl space-y-6 text-center">
      <p className="uppercase tracking-[0.3em] text-amber-400 text-sm font-bold">
        {isTiebreak ? "Desempate" : question.roundTitle}
      </p>
      {question.imageUrl && (
        <img src={question.imageUrl} alt="" className="mx-auto max-h-72 rounded-lg border border-neutral-800" />
      )}
      <p className="text-3xl font-bold text-wrap-balance">{question.prompt}</p>
      {question.detail && <p className="text-neutral-500 text-sm font-mono">{question.detail}</p>}

      <div className="h-3 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="font-mono text-neutral-400">
        {answeredCount}/{total} respondieron · {Math.ceil(remaining / 1000)}s
      </p>

      <button
        onClick={() => advance(room.id, "reveal")}
        className="rounded-md bg-neutral-100 text-neutral-950 font-bold uppercase tracking-wide px-8 py-3 hover:bg-white"
      >
        Mostrar respuesta
      </button>
    </div>
  );
}

function RevealPhase({
  question,
  majorityName,
  sortedByScore,
  room,
  isLastQuestionOverall,
  players,
}: {
  question: NonNullable<ReturnType<typeof useCurrentQuestion>>;
  majorityName: string | null;
  sortedByScore: { id: string; name: string; score: number }[];
  room: { id: string };
  isLastQuestionOverall: boolean;
  players: { id: string; name: string }[];
}) {
  const [tiePicks, setTiePicks] = useState<string[]>([]);

  return (
    <div className="w-full max-w-2xl space-y-6 text-center">
      <p className="uppercase tracking-[0.3em] text-amber-400 text-sm font-bold">{question.roundTitle}</p>
      <p className="text-2xl font-bold">{question.prompt}</p>

      {question.roundType === "most-likely" ? (
        <p className="text-4xl font-black text-amber-400">La mayoría dijo: {majorityName ?? "nadie votó"}</p>
      ) : (
        <p className="text-4xl font-black text-amber-400">
          {question.options?.[question.correctIndex ?? -1] ?? "—"}
        </p>
      )}

      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <p className="text-sm uppercase tracking-widest text-neutral-400 mb-2">Marcador</p>
        <ol className="grid grid-cols-3 gap-2 text-sm">
          {sortedByScore.slice(0, 9).map((p, i) => (
            <li key={p.id} className="flex justify-between gap-2 bg-neutral-800/50 rounded px-2 py-1">
              <span>#{i + 1} {p.name}</span>
              <span className="font-mono">{p.score}</span>
            </li>
          ))}
        </ol>
      </div>

      {!isLastQuestionOverall && (
        <button
          onClick={() => advance(room.id, "next")}
          className="rounded-md bg-amber-500 text-neutral-950 font-bold uppercase tracking-wide px-8 py-3 hover:bg-amber-400"
        >
          Siguiente
        </button>
      )}

      {isLastQuestionOverall && (
        <div className="space-y-4 pt-4 border-t border-neutral-800">
          <p className="text-neutral-400 text-sm">Último round terminado. ¿Hay empate en el 1er puesto?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() =>
                  setTiePicks((prev) => (prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]))
                }
                className={`rounded-full px-4 py-1.5 text-sm border ${
                  tiePicks.includes(p.id)
                    ? "bg-red-500 border-red-500 text-neutral-950 font-bold"
                    : "border-neutral-700 text-neutral-300"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              disabled={tiePicks.length < 2}
              onClick={() => advance(room.id, "start_tiebreak", { tiebreakPlayerIds: tiePicks })}
              className="rounded-md bg-red-500 disabled:opacity-30 text-neutral-950 font-bold uppercase tracking-wide px-6 py-3 hover:bg-red-400"
            >
              Desempate entre {tiePicks.length || "…"}
            </button>
            <button
              onClick={() => advance(room.id, "start_final_vote")}
              className="rounded-md bg-neutral-100 text-neutral-950 font-bold uppercase tracking-wide px-6 py-3 hover:bg-white"
            >
              Sin empate: votación final
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShopPhase({
  roomId,
  players,
}: {
  roomId: string;
  players: { id: string; name: string; score: number }[];
}) {
  return (
    <div className="text-center space-y-6 max-w-lg">
      <p className="text-3xl font-black uppercase text-amber-400">🪙 La Tienda está abierta</p>
      <p className="text-neutral-400">Compren poderes desde el celular.</p>
      <ol className="grid grid-cols-3 gap-2 text-sm">
        {[...players]
          .sort((a, b) => b.score - a.score)
          .map((p) => (
            <li key={p.id} className="flex justify-between bg-neutral-900 border border-neutral-800 rounded px-3 py-2">
              <span>{p.name}</span>
              <span className="font-mono">{p.score}</span>
            </li>
          ))}
      </ol>
      <button
        onClick={() => advance(roomId, "close_shop")}
        className="rounded-md bg-amber-500 text-neutral-950 font-bold uppercase tracking-wide px-8 py-3 hover:bg-amber-400"
      >
        Cerrar tienda y seguir
      </button>
    </div>
  );
}

function FinalVotePhase({
  room,
  players,
  votes,
}: {
  room: { id: string };
  players: { id: string }[];
  votes: { voter_id: string }[];
}) {
  const votedIds = new Set(votes.map((v) => v.voter_id));
  return (
    <div className="text-center space-y-6 max-w-lg">
      <p className="text-3xl font-black uppercase">🕵️ ¿Quién era el Infiltrado?</p>
      <p className="text-neutral-400">Todos voten desde el celular. En vivo:</p>
      <p className="font-mono text-2xl">{votedIds.size}/{players.length} votaron</p>
      <button
        onClick={() => advance(room.id, "finish")}
        className="rounded-md bg-red-500 text-neutral-950 font-bold uppercase tracking-wide px-8 py-4 hover:bg-red-400"
      >
        Ver resultados
      </button>
    </div>
  );
}

function ResultsPhase({
  players,
  votes,
}: {
  room: { id: string };
  players: { id: string; name: string; score: number; is_infiltrado: boolean; infiltrado_points: number }[];
  votes: { suspect_id: string }[];
}) {
  const champion = [...players].sort((a, b) => b.score - a.score)[0];
  const infiltrado = players.find((p) => p.is_infiltrado);
  const tally = new Map<string, number>();
  for (const v of votes) tally.set(v.suspect_id, (tally.get(v.suspect_id) ?? 0) + 1);
  let topSuspect: string | null = null;
  let topCount = 0;
  for (const [id, c] of tally) {
    if (c > topCount) {
      topSuspect = id;
      topCount = c;
    }
  }
  const discovered = infiltrado && topSuspect === infiltrado.id;

  return (
    <div className="text-center space-y-10 max-w-xl">
      <div>
        <p className="uppercase tracking-[0.3em] text-amber-400 text-sm font-bold">Campeón de la noche</p>
        <p className="text-5xl font-black">{champion?.name}</p>
        <p className="font-mono text-neutral-400">{champion?.score} pts</p>
      </div>
      <div>
        <p className="uppercase tracking-[0.3em] text-red-400 text-sm font-bold">El Infiltrado era</p>
        <p className="text-5xl font-black">{infiltrado?.name}</p>
        <p className="text-neutral-400">
          {discovered ? "Descubierto por el grupo" : "Sobrevivió sin ser descubierto"} ·{" "}
          <span className="font-mono">{infiltrado?.infiltrado_points} pts de infiltrado</span>
        </p>
      </div>
      <ol className="grid grid-cols-3 gap-2 text-sm text-left">
        {[...players]
          .sort((a, b) => b.score - a.score)
          .map((p, i) => (
            <li key={p.id} className="flex justify-between bg-neutral-900 border border-neutral-800 rounded px-3 py-2">
              <span>#{i + 1} {p.name}</span>
              <span className="font-mono">{p.score}</span>
            </li>
          ))}
      </ol>
    </div>
  );
}
