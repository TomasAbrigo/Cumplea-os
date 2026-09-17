"use client";
import { useEffect, useMemo, useState } from "react";
import { useRoom } from "@/lib/useRoom";
import { useCurrentQuestion } from "@/lib/useQuestion";
import { useMeta } from "@/lib/useMeta";
import { QUESTION_DURATION_MS } from "@/types/game";
import { PROFILES, getProfile } from "@/lib/profiles";
import { Screen } from "@/components/design/Screen";
import { Panel, Pill } from "@/components/design/Panel";
import { CandyButton } from "@/components/design/CandyButton";
import { Avatar } from "@/components/design/Avatar";
import { ProfileTile } from "@/components/design/ProfileTile";
import { ArtImage } from "@/components/design/ArtImage";

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

  if (loading)
    return (
      <Screen variant="tv">
        <Centered>
          <p className="animate-pulse font-display text-3xl text-text-secondary">Cargando…</p>
        </Centered>
      </Screen>
    );
  if (notFound || !room)
    return (
      <Screen variant="tv">
        <Centered>
          <p className="font-display text-3xl text-danger">No existe la sala {code}</p>
        </Centered>
      </Screen>
    );

  const isTiebreak = room.current_round === -1;
  const lastRoundIndex = meta ? meta.rounds.length - 1 : -1;
  const lastRoundCount = meta ? meta.rounds[lastRoundIndex]?.count ?? 0 : 0;
  const isLastQuestionOverall =
    !isTiebreak && room.current_round === lastRoundIndex && room.current_question === lastRoundCount - 1;

  const answeredIds = new Set(currentAnswers.map((a) => a.player_id));
  const audience = isTiebreak ? players.filter((p) => room.tiebreak_player_ids.includes(p.id)) : players;

  return (
    <Screen variant="tv" confetti={room.phase === "results"}>
      {room.phase !== "lobby" && (
        <header className="flex items-center justify-between px-10 py-5">
          <div>
            <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-lime">La Noche de los 9</p>
            <p className="font-display text-2xl tracking-[0.2em]">{code}</p>
          </div>
          <ol className="flex gap-5">
            {sortedByScore.slice(0, 5).map((p, i) => {
              const prof = getProfile(p.name);
              return (
                <li key={p.id} className="flex flex-col items-center gap-1 text-center">
                  <span className="font-display text-[10px] text-text-muted">#{i + 1}</span>
                  <Avatar color={prof.color} emoji={prof.emoji} size={40} />
                  <div className="font-heading text-xs font-bold">{p.name}</div>
                  <div className="font-display text-sm text-gold">{p.score}</div>
                </li>
              );
            })}
          </ol>
        </header>
      )}

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-12 py-8">
        {room.phase === "lobby" && <Lobby room={room} players={players} code={code} />}
        {room.phase === "roles" && <RolesPhase room={room} />}
        {room.phase === "question" && question && (
          <QuestionPhase
            question={question}
            room={room}
            now={now}
            answeredIds={answeredIds}
            total={audience.length}
            isTiebreak={isTiebreak}
            players={players}
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
            correctCount={currentAnswers.filter((a) => a.is_correct).length}
          />
        )}
        {room.phase === "shop" && <ShopPhase roomId={room.id} players={players} />}
        {room.phase === "final_vote" && <FinalVotePhase room={room} players={players} votes={votes} />}
        {room.phase === "results" && <ResultsPhase room={room} players={players} votes={votes} />}
      </main>
    </Screen>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center">{children}</div>;
}

function Lobby({
  room,
  players,
  code,
}: {
  room: { id: string };
  players: { id: string; name: string; is_bot: boolean }[];
  code: string;
}) {
  const [addingBots, setAddingBots] = useState(false);
  const joinedNames = new Set(players.map((p) => p.name));

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
    <div className="flex w-full max-w-6xl items-center gap-16 animate-pop-in">
      <div className="flex flex-1 flex-col items-center gap-6 text-center">
        <ArtImage src="/assets/hero9.png" className="h-52 w-52 object-contain animate-float-a" />
        <p className="font-display text-4xl tracking-wide opacity-80">LA NOCHE DE LOS 9</p>
        <p className="font-heading text-sm font-semibold uppercase tracking-[0.3em] text-text-muted">
          Código de sala
        </p>
        <div className="flex gap-3">
          {code.split("").map((ch, i) => (
            <div
              key={i}
              className="flex h-20 w-16 items-center justify-center rounded-2xl border-2 border-surface-line bg-surface-2 font-display text-4xl"
            >
              {ch}
            </div>
          ))}
        </div>
        <p className="text-sm text-text-secondary">💡 Entrá desde tu celular con ese código</p>
      </div>

      <div className="flex flex-1 flex-col items-center gap-6">
        <div className="flex w-full items-center justify-between">
          <p className="font-display text-xl">YA ENTRARON</p>
          <Pill tone="gold">{players.length} / 9</Pill>
        </div>
        <div className="grid w-full grid-cols-3 gap-4">
          {PROFILES.map((p) => (
            <ProfileTile
              key={p.id}
              profile={p}
              avatarSize={64}
              state={joinedNames.has(p.name) ? "default" : "empty"}
            />
          ))}
        </div>
        <CandyButton
          color="#FF3B5C"
          disabled={players.length < 1}
          onClick={() =>
            fetch("/api/start", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomId: room.id }),
            })
          }
        >
          Sortear infiltrado y arrancar
        </CandyButton>
        <button
          onClick={addBots}
          disabled={addingBots}
          className="rounded-full border-2 border-surface-line px-4 py-2 text-sm text-text-secondary disabled:opacity-40"
        >
          🤖 Sumar 2 bots (para testear solo)
        </button>
      </div>
    </div>
  );
}

function RolesPhase({ room }: { room: { id: string } }) {
  return (
    <Panel className="flex max-w-2xl flex-col items-center gap-5 p-12 text-center animate-pop-in">
      <p className="font-display text-3xl">🕵️ El Infiltrado ya fue sorteado</p>
      <p className="text-text-secondary">
        Cada uno toca &quot;Revelar mi rol&quot; en su celular. Cuando todos estén listos, arrancá el Round 1.
      </p>
      <CandyButton color="#FFC93C" fullWidth={false} onClick={() => advance(room.id, "start_questions")}>
        Arrancar Round 1
      </CandyButton>
    </Panel>
  );
}

function CircularTimer({ pct, seconds }: { pct: number; seconds: number }) {
  const r = 130;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex h-[300px] w-[300px] shrink-0 items-center justify-center">
      <svg width="300" height="300" className="absolute -rotate-90">
        <circle cx="150" cy="150" r={r} stroke="rgba(0,0,0,0.35)" strokeWidth="28" fill="none" />
        <circle
          cx="150"
          cy="150"
          r={r}
          stroke="#B4FF39"
          strokeWidth="28"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ filter: "drop-shadow(0 0 18px rgba(180,255,57,0.6))", transition: "stroke-dashoffset 0.3s linear" }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="font-display text-7xl leading-none">{seconds}</span>
        <span className="font-display text-sm tracking-[0.25em] text-lime">SEGUNDOS</span>
      </div>
    </div>
  );
}

function QuestionPhase({
  question,
  room,
  now,
  answeredIds,
  total,
  isTiebreak,
  players,
}: {
  question: NonNullable<ReturnType<typeof useCurrentQuestion>>;
  room: { id: string; question_started_at: string | null };
  now: number;
  answeredIds: Set<string>;
  total: number;
  isTiebreak: boolean;
  players: { id: string; name: string }[];
}) {
  const startedAt = room.question_started_at ? new Date(room.question_started_at).getTime() : now;
  const elapsed = now - startedAt;
  const remaining = Math.max(0, QUESTION_DURATION_MS - elapsed);
  const pct = Math.max(0, Math.min(100, (remaining / QUESTION_DURATION_MS) * 100));

  return (
    <div className="flex w-full max-w-6xl flex-col gap-10 animate-pop-in">
      <Pill>{isTiebreak ? "Desempate" : question.roundTitle}</Pill>

      <div className="flex items-center gap-10">
        <Panel className="flex flex-1 flex-col items-center gap-6 p-14 text-center">
          {question.imageUrl ? (
            <img src={question.imageUrl} alt="" className="max-h-64 rounded-3xl border-2 border-surface-line object-cover" />
          ) : (
            <span className="text-6xl text-lime">❝</span>
          )}
          <p className="text-balance font-display text-4xl leading-tight">{question.prompt}</p>
          {question.detail && <p className="font-heading text-sm text-text-muted">{question.detail}</p>}
        </Panel>
        <CircularTimer pct={pct} seconds={Math.ceil(remaining / 1000)} />
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="font-display text-sm tracking-widest text-text-secondary">RESPONDIERON</p>
        <div className="flex items-center gap-3">
          {players.map((pl) => {
            const prof = getProfile(pl.name);
            return <Avatar key={pl.id} color={prof.color} emoji={prof.emoji} size={40} dim={!answeredIds.has(pl.id)} />;
          })}
          <span className="ml-2 font-display text-2xl">
            {answeredIds.size}/{total}
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <CandyButton color="#FFFFFF" fullWidth={false} onClick={() => advance(room.id, "reveal")}>
          Mostrar respuesta
        </CandyButton>
      </div>
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
  correctCount,
}: {
  question: NonNullable<ReturnType<typeof useCurrentQuestion>>;
  majorityName: string | null;
  sortedByScore: { id: string; name: string; score: number }[];
  room: { id: string };
  isLastQuestionOverall: boolean;
  players: { id: string; name: string }[];
  correctCount: number;
}) {
  const [tiePicks, setTiePicks] = useState<string[]>([]);
  const answerName = question.roundType === "most-likely" ? majorityName ?? "nadie votó" : question.options?.[question.correctIndex ?? -1] ?? "—";
  const answerProfile = getProfile(answerName);
  const isPerson = PROFILES.some((p) => p.name === answerName);

  return (
    <div className="flex w-full max-w-6xl flex-col gap-8 animate-pop-in">
      <div className="flex items-center gap-10">
        <div className="flex w-[45%] flex-col items-center gap-4 text-center">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.3em] text-text-secondary">
            La respuesta era
          </p>
          {isPerson ? (
            <Avatar color={answerProfile.color} emoji={answerProfile.emoji} size={200} />
          ) : (
            <span className="text-8xl">🎯</span>
          )}
          <p className="font-display text-6xl" style={{ color: isPerson ? answerProfile.color : "#FFD54A" }}>
            {answerName.toUpperCase()}
          </p>
          <p className="max-w-xs text-text-secondary">{question.prompt}</p>
          <div
            className="flex items-center gap-3 rounded-3xl px-6 py-3 font-display text-xl text-[#0A2A15]"
            style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(0,0,0,0.33)), #33E88E" }}
          >
            ✅ {correctCount} de {players.length} acertaron
          </div>
        </div>

        <Panel className="flex-1 p-8">
          <p className="mb-5 text-center font-display text-2xl">🏆 RANKING</p>
          <ol className="flex flex-col gap-2.5">
            {sortedByScore.slice(0, 9).map((p, i) => {
              const prof = getProfile(p.name);
              const gold = i === 0;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-4 rounded-2xl px-4 py-2"
                  style={{
                    background: gold
                      ? "linear-gradient(to bottom, rgba(255,255,255,0), rgba(0,0,0,0.33)), #FFD54A"
                      : "rgba(255,255,255,0.04)",
                    color: gold ? "#221500" : undefined,
                  }}
                >
                  <span className="w-8 font-display text-xl">{i + 1}</span>
                  <Avatar color={prof.color} emoji={prof.emoji} size={36} />
                  <span className="flex-1 font-heading font-bold">{p.name}</span>
                  <span className="font-display text-lg">{p.score}</span>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>

      {!isLastQuestionOverall && (
        <div className="flex justify-center">
          <CandyButton color="#FFC93C" fullWidth={false} onClick={() => advance(room.id, "next")}>
            Siguiente
          </CandyButton>
        </div>
      )}

      {isLastQuestionOverall && (
        <Panel className="flex flex-col items-center gap-4 p-6">
          <p className="text-sm text-text-secondary">Último round terminado. ¿Hay empate en el 1er puesto?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() =>
                  setTiePicks((prev) => (prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]))
                }
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold ${
                  tiePicks.includes(p.id) ? "border-danger bg-danger text-white" : "border-surface-line text-text-secondary"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <CandyButton
              color="#FF3B5C"
              fullWidth={false}
              disabled={tiePicks.length < 2}
              onClick={() => advance(room.id, "start_tiebreak", { tiebreakPlayerIds: tiePicks })}
            >
              Desempate entre {tiePicks.length || "…"}
            </CandyButton>
            <CandyButton color="#FFFFFF" fullWidth={false} onClick={() => advance(room.id, "start_final_vote")}>
              Sin empate: votación final
            </CandyButton>
          </div>
        </Panel>
      )}
    </div>
  );
}

function ShopPhase({ roomId, players }: { roomId: string; players: { id: string; name: string; score: number }[] }) {
  return (
    <Panel className="flex max-w-xl flex-col items-center gap-6 p-10 text-center animate-pop-in">
      <p className="font-display text-3xl text-gold">🪙 La Tienda está abierta</p>
      <p className="text-text-secondary">Compren poderes desde el celular.</p>
      <ol className="grid w-full grid-cols-3 gap-2">
        {[...players]
          .sort((a, b) => b.score - a.score)
          .map((p) => {
            const prof = getProfile(p.name);
            return (
              <li key={p.id} className="flex items-center gap-2 rounded-xl border-2 border-surface-line bg-black/20 px-3 py-2">
                <Avatar color={prof.color} emoji={prof.emoji} size={24} />
                <span className="flex-1 truncate text-sm">{p.name}</span>
                <span className="font-display text-sm text-gold">{p.score}</span>
              </li>
            );
          })}
      </ol>
      <CandyButton color="#FFC93C" fullWidth={false} onClick={() => advance(roomId, "close_shop")}>
        Cerrar tienda y seguir
      </CandyButton>
    </Panel>
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
    <Panel className="flex max-w-xl flex-col items-center gap-6 p-10 text-center animate-pop-in">
      <p className="font-display text-3xl">🕵️ ¿Quién era el Infiltrado?</p>
      <p className="text-text-secondary">Todos voten desde el celular. En vivo:</p>
      <p className="font-display text-4xl text-lime">
        {votedIds.size}/{players.length} votaron
      </p>
      <CandyButton color="#FF3B5C" fullWidth={false} onClick={() => advance(room.id, "finish")}>
        Ver resultados
      </CandyButton>
    </Panel>
  );
}

function Podium({ player, rank, height }: { player: { name: string; score: number } | undefined; rank: number; height: number }) {
  if (!player) return <div className="w-64" />;
  const prof = getProfile(player.name);
  const avatarSize = rank === 1 ? 190 : 140;
  const pedColors: Record<number, string> = { 1: "#FFD54A", 2: "#C9D4E0", 3: "#E08A4B" };
  return (
    <div className="flex w-64 flex-col items-center gap-3">
      {rank === 1 ? (
        <ArtImage src="/assets/trophy.png" className="h-32 w-40 object-contain animate-float-c" />
      ) : (
        <div style={{ height: 40 }} />
      )}
      <Avatar color={prof.color} emoji={prof.emoji} size={avatarSize} animated={rank === 1} />
      <p className="font-display" style={{ fontSize: rank === 1 ? 42 : 30 }}>
        {player.name}
      </p>
      <p className="font-display text-lime" style={{ fontSize: rank === 1 ? 28 : 22 }}>
        {player.score}
      </p>
      <div
        className="flex w-full items-center justify-center rounded-t-3xl"
        style={{
          height,
          background: `linear-gradient(to bottom, rgba(255,255,255,0), rgba(0,0,0,0.33)), ${pedColors[rank]}`,
          boxShadow: "0 10px 0 rgba(255,255,255,0.25) inset",
        }}
      >
        <span className="font-display text-7xl text-black/30">{rank}</span>
      </div>
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
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const [first, second, third] = ranked;
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
  const infProfile = getProfile(infiltrado?.name);

  return (
    <div className="flex w-full max-w-6xl flex-col items-center gap-10 animate-pop-in">
      <p className="font-display text-4xl tracking-wide">RESULTADOS DE LA NOCHE</p>
      <div className="flex w-full items-end justify-between gap-9">
        <div className="flex flex-1 items-end justify-center gap-4">
          <Podium player={second} rank={2} height={150} />
          <Podium player={first} rank={1} height={220} />
          <Podium player={third} rank={3} height={110} />
        </div>

        <div
          className="flex w-[420px] flex-col items-center gap-3 rounded-[36px] border-4 p-8 text-center"
          style={{ borderColor: "#FF3B5C", background: "rgba(42,11,46,0.8)", boxShadow: "0 0 60px rgba(255,59,92,0.35)" }}
        >
          <ArtImage src="/assets/mask.png" className="h-32 w-44 object-contain" />
          <p className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-text-secondary">
            El infiltrado era
          </p>
          <div className="flex items-center gap-3">
            {infiltrado && <Avatar color={infProfile.color} emoji={infProfile.emoji} size={64} />}
            <p className="font-display text-5xl text-danger">{infiltrado?.name}</p>
          </div>
          <div
            className="flex items-center gap-2 rounded-3xl px-5 py-2.5 font-display text-lg text-[#0A2A15]"
            style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(0,0,0,0.33)), #33E88E" }}
          >
            {discovered ? "🎯 ¡LO AGARRARON!" : "🕶️ SOBREVIVIÓ"}
          </div>
          <p className="text-sm text-text-secondary">
            {discovered ? "Descubierto por el grupo" : "Sobrevivió sin ser descubierto"} ·{" "}
            <span className="font-display text-gold">{infiltrado?.infiltrado_points} pts de infiltrado</span>
          </p>
        </div>
      </div>

      <ol className="grid w-full max-w-3xl grid-cols-3 gap-2 text-sm">
        {ranked.map((p, i) => {
          const prof = getProfile(p.name);
          return (
            <li key={p.id} className="flex items-center gap-2 rounded-xl border-2 border-surface-line bg-black/20 px-3 py-2">
              <span className="font-display text-text-muted">#{i + 1}</span>
              <Avatar color={prof.color} emoji={prof.emoji} size={22} />
              <span className="flex-1 truncate">{p.name}</span>
              <span className="font-display text-gold">{p.score}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
