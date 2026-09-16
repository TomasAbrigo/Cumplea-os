"use client";
import { useEffect, useMemo, useState } from "react";
import { useRoom } from "@/lib/useRoom";
import { useCurrentQuestion } from "@/lib/useQuestion";
import { POWER_COSTS, PowerType } from "@/types/game";

interface StoredPlayer {
  id: string;
  name: string;
}

interface Mission {
  mission_index: number;
  resolved_text: string;
  completed_at: string | null;
}

function loadPlayer(code: string): StoredPlayer | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`player:${code}`);
  return raw ? JSON.parse(raw) : null;
}
function savePlayer(code: string, p: StoredPlayer) {
  window.localStorage.setItem(`player:${code}`, JSON.stringify(p));
}

export default function PlayView({ code }: { code: string }) {
  const { room, players, loading, notFound } = useRoom(code);
  const [me, setMe] = useState<StoredPlayer | null>(null);
  const [joinError, setJoinError] = useState("");
  const [nameInput, setNameInput] = useState("");
  const question = useCurrentQuestion(room?.id, room?.phase, room?.current_round, room?.current_question);
  const [answered, setAnswered] = useState(false);
  const [pistaHidden, setPistaHidden] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con localStorage al montar
    setMe(loadPlayer(code));
  }, [code]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetea al cambiar de pregunta
    setAnswered(false);
    if (!room) return;
    const raw = window.localStorage.getItem(`pista:${code}`);
    if (raw) {
      const hint = JSON.parse(raw);
      if (hint.round === room.current_round && hint.question === room.current_question) {
        setPistaHidden(hint.hiddenIndex);
      } else {
        setPistaHidden(null);
      }
    }
  }, [code, room?.current_round, room?.current_question, room?.phase]);

  const myPlayer = useMemo(() => players.find((p) => p.id === me?.id) ?? null, [players, me]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setJoinError("");
    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: code, name: nameInput }),
    });
    const data = await res.json();
    if (!res.ok) {
      setJoinError(data.error);
      return;
    }
    savePlayer(code, { id: data.player.id, name: data.player.name });
    setMe({ id: data.player.id, name: data.player.name });
  }

  if (loading) return <Centered>Cargando…</Centered>;
  if (notFound || !room) return <Centered>No existe la sala {code}</Centered>;

  if (!me || !myPlayer) {
    return (
      <Centered>
        <form onSubmit={join} className="space-y-4 w-full max-w-xs text-center">
          <p className="text-2xl font-black uppercase">Sala {code}</p>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Tu nombre"
            maxLength={24}
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-3 text-center outline-none focus:border-amber-400"
          />
          <button className="w-full rounded-md bg-amber-500 text-neutral-950 font-bold py-3 uppercase">
            Unirme
          </button>
          {joinError && <p className="text-red-400 text-sm">{joinError}</p>}
        </form>
      </Centered>
    );
  }

  async function submitChoice(choice: number) {
    if (answered || !room || !myPlayer) return;
    setAnswered(true);
    await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id, playerId: myPlayer.id, choice }),
    });
  }

  async function submitVoteForMostLikely(choicePlayerId: string) {
    if (answered || !room || !myPlayer) return;
    setAnswered(true);
    await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id, playerId: myPlayer.id, choicePlayerId }),
    });
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <span className="font-mono text-sm text-neutral-400">{code}</span>
        <span className="font-bold">{myPlayer.name}</span>
        <span className="font-mono text-amber-400">{myPlayer.score} pts</span>
      </header>

      <RoleAndMissions code={code} player={myPlayer} phase={room.phase} />

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-6">
        {room.phase === "lobby" && (
          <p className="text-neutral-400 text-center">Esperando a que el host arranque la partida…</p>
        )}

        {room.phase === "roles" && (
          <p className="text-neutral-400 text-center">
            Esperá a que la pantalla principal arranque el Round 1.
          </p>
        )}

        {room.phase === "question" && question && question.roundType !== "most-likely" && (
          <ChoiceQuestionCard
            question={question}
            hiddenIndex={pistaHidden}
            answered={answered}
            onPick={submitChoice}
          />
        )}

        {room.phase === "question" && question && question.roundType === "most-likely" && (
          <MostLikelyCard prompt={question.prompt} players={players} answered={answered} onPick={submitVoteForMostLikely} />
        )}

        {room.phase === "reveal" && question && (
          <div className="text-center space-y-3">
            <p className="uppercase tracking-widest text-amber-400 text-xs font-bold">{question.roundTitle}</p>
            <p className="text-xl font-bold">Mirá la pantalla principal 📺</p>
          </div>
        )}

        {room.phase === "shop" && (
          <ShopCard roomId={room.id} me={myPlayer} players={players} code={code} currentRound={room.current_round} />
        )}

        {room.phase === "final_vote" && (
          <FinalVoteCard roomId={room.id} me={myPlayer} players={players} />
        )}

        {room.phase === "results" && (
          <p className="text-2xl font-black text-center">🎉 ¡Gracias por jugar! Mirá la tele para los resultados.</p>
        )}
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center p-6">
      {children}
    </div>
  );
}

function RoleAndMissions({
  code,
  player,
  phase,
}: {
  code: string;
  player: { id: string; is_infiltrado: boolean };
  phase: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con localStorage al montar
    setRevealed(window.localStorage.getItem(`revealed:${code}:${player.id}`) === "1");
  }, [code, player.id]);

  useEffect(() => {
    if (revealed && player.is_infiltrado) {
      fetch(`/api/mission?playerId=${player.id}`)
        .then((r) => r.json())
        .then((d) => setMissions(d.missions ?? []));
    }
  }, [revealed, player.is_infiltrado, player.id]);

  if (phase === "lobby") return null;

  if (!revealed) {
    return (
      <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-900 text-center">
        <button
          onClick={() => {
            window.localStorage.setItem(`revealed:${code}:${player.id}`, "1");
            setRevealed(true);
            setOpen(true);
          }}
          className="rounded-md bg-neutral-100 text-neutral-950 font-bold uppercase tracking-wide px-6 py-2"
        >
          Revelar mi rol
        </button>
      </div>
    );
  }

  async function completeMission(index: number) {
    await fetch("/api/mission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: player.id, missionIndex: index }),
    });
    setMissions((prev) => prev.map((m) => (m.mission_index === index ? { ...m, completed_at: new Date().toISOString() } : m)));
  }

  return (
    <div className="border-b border-neutral-800 bg-neutral-900">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full px-5 py-2 text-sm font-bold uppercase tracking-wide flex justify-between items-center ${
          player.is_infiltrado ? "text-red-400" : "text-neutral-400"
        }`}
      >
        <span>{player.is_infiltrado ? "🕵️ Infiltrado" : "🙂 Civil"}</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-2">
          {player.is_infiltrado ? (
            missions.length === 0 ? (
              <p className="text-neutral-500 text-sm">Cargando misiones…</p>
            ) : (
              missions.map((m) => (
                <div
                  key={m.mission_index}
                  className={`flex items-center justify-between gap-3 rounded px-3 py-2 text-sm ${
                    m.completed_at ? "bg-neutral-800/40 text-neutral-500 line-through" : "bg-neutral-800"
                  }`}
                >
                  <span>{m.resolved_text}</span>
                  {!m.completed_at && (
                    <button
                      onClick={() => completeMission(m.mission_index)}
                      className="shrink-0 rounded bg-red-500 text-neutral-950 font-bold px-2 py-1 text-xs uppercase"
                    >
                      Cumplida
                    </button>
                  )}
                </div>
              ))
            )
          ) : (
            <p className="text-neutral-500 text-sm">
              Sos Civil. Disfrutá la noche y tratá de descubrir quién es el Infiltrado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ChoiceQuestionCard({
  question,
  hiddenIndex,
  answered,
  onPick,
}: {
  question: NonNullable<ReturnType<typeof useCurrentQuestion>>;
  hiddenIndex: number | null;
  answered: boolean;
  onPick: (i: number) => void;
}) {
  return (
    <div className="w-full max-w-md space-y-5 text-center">
      <p className="uppercase tracking-widest text-amber-400 text-xs font-bold">{question.roundTitle}</p>
      {question.imageUrl && (
        <img src={question.imageUrl} alt="" className="mx-auto max-h-56 rounded-lg border border-neutral-800" />
      )}
      <p className="text-xl font-bold">{question.prompt}</p>
      <div className="grid grid-cols-1 gap-3">
        {question.options?.map((opt, i) =>
          i === hiddenIndex ? (
            <div key={i} className="rounded-md border border-neutral-800 bg-neutral-900/40 py-3 text-neutral-600 line-through">
              {opt}
            </div>
          ) : (
            <button
              key={i}
              disabled={answered}
              onClick={() => onPick(i)}
              className="rounded-md border border-neutral-700 bg-neutral-800 py-3 font-semibold hover:border-amber-400 disabled:opacity-40"
            >
              {opt}
            </button>
          )
        )}
      </div>
      {answered && <p className="text-neutral-500 text-sm">Respuesta enviada, esperando a los demás…</p>}
    </div>
  );
}

function MostLikelyCard({
  prompt,
  players,
  answered,
  onPick,
}: {
  prompt: string;
  players: { id: string; name: string }[];
  answered: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <div className="w-full max-w-md space-y-5 text-center">
      <p className="uppercase tracking-widest text-amber-400 text-xs font-bold">¿Quién es más probable que...?</p>
      <p className="text-xl font-bold">{prompt}</p>
      <div className="grid grid-cols-3 gap-2">
        {players.map((p) => (
          <button
            key={p.id}
            disabled={answered}
            onClick={() => onPick(p.id)}
            className="rounded-md border border-neutral-700 bg-neutral-800 py-3 text-sm font-semibold hover:border-amber-400 disabled:opacity-40"
          >
            {p.name}
          </button>
        ))}
      </div>
      {answered && <p className="text-neutral-500 text-sm">Voto enviado, esperando a los demás…</p>}
    </div>
  );
}

const POWER_LABELS: Record<PowerType, { emoji: string; blurb: string }> = {
  duplicador: { emoji: "🔥", blurb: "Tu próxima respuesta correcta vale x2." },
  escudo: { emoji: "🛡️", blurb: "Bloquea el próximo ataque que te llegue." },
  robo: { emoji: "🔫", blurb: "Robás 150 pts a quien elijas." },
  pista: { emoji: "👁️", blurb: "Eliminás una respuesta incorrecta de tu próxima pregunta." },
  bomba: { emoji: "💣", blurb: "Su próxima pregunta vale la mitad." },
};

function ShopCard({
  roomId,
  me,
  players,
  code,
  currentRound,
}: {
  roomId: string;
  me: { id: string; score: number };
  players: { id: string; name: string }[];
  code: string;
  currentRound: number;
}) {
  const [pendingTarget, setPendingTarget] = useState<PowerType | null>(null);
  const [bought, setBought] = useState<Set<PowerType>>(new Set());
  const [msg, setMsg] = useState("");

  async function buy(power: PowerType, targetPlayerId?: string) {
    const res = await fetch("/api/power", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, playerId: me.id, power, targetPlayerId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error);
      return;
    }
    if (power === "pista" && data.hiddenOptionIndex !== null && data.hiddenOptionIndex !== undefined) {
      // La pista se aplica a la próxima pregunta (primera del siguiente round)
      window.localStorage.setItem(
        `pista:${code}`,
        JSON.stringify({ round: currentRound + 1, question: 0, hiddenIndex: data.hiddenOptionIndex })
      );
    }
    setBought((prev) => new Set(prev).add(power));
    setPendingTarget(null);
    setMsg("");
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <p className="text-2xl font-black uppercase text-center text-amber-400">🪙 La Tienda</p>
      <p className="text-center text-neutral-400">Tenés {me.score} pts</p>
      {msg && <p className="text-red-400 text-sm text-center">{msg}</p>}
      <div className="space-y-2">
        {(Object.keys(POWER_COSTS) as PowerType[]).map((power) => {
          const cost = POWER_COSTS[power];
          const needsTarget = power === "robo" || power === "bomba";
          const disabled = bought.has(power) || me.score < cost;
          return (
            <div key={power} className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase text-sm">
                  {POWER_LABELS[power].emoji} {power}
                </span>
                <span className="font-mono text-amber-400">{cost}</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">{POWER_LABELS[power].blurb}</p>
              {needsTarget && pendingTarget === power ? (
                <div className="grid grid-cols-3 gap-1 mt-2">
                  {players
                    .filter((p) => p.id !== me.id)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => buy(power, p.id)}
                        className="rounded bg-neutral-800 border border-neutral-700 py-1.5 text-xs hover:border-red-400"
                      >
                        {p.name}
                      </button>
                    ))}
                </div>
              ) : (
                <button
                  disabled={disabled}
                  onClick={() => (needsTarget ? setPendingTarget(power) : buy(power))}
                  className="mt-2 w-full rounded bg-amber-500 disabled:opacity-30 text-neutral-950 font-bold uppercase text-xs py-2"
                >
                  {bought.has(power) ? "Comprado" : "Comprar"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinalVoteCard({
  roomId,
  me,
  players,
}: {
  roomId: string;
  me: { id: string };
  players: { id: string; name: string }[];
}) {
  const [voted, setVoted] = useState(false);

  async function vote(suspectId: string) {
    if (voted) return;
    setVoted(true);
    await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, voterId: me.id, suspectId }),
    });
  }

  return (
    <div className="w-full max-w-md space-y-5 text-center">
      <p className="text-2xl font-black uppercase">🕵️ ¿Quién era el Infiltrado?</p>
      <div className="grid grid-cols-3 gap-2">
        {players
          .filter((p) => p.id !== me.id)
          .map((p) => (
            <button
              key={p.id}
              disabled={voted}
              onClick={() => vote(p.id)}
              className="rounded-md border border-neutral-700 bg-neutral-800 py-3 text-sm font-semibold hover:border-red-400 disabled:opacity-40"
            >
              {p.name}
            </button>
          ))}
      </div>
      {voted && <p className="text-neutral-500 text-sm">Voto enviado.</p>}
    </div>
  );
}
