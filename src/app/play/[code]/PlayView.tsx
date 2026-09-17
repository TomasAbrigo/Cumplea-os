"use client";
import { useEffect, useMemo, useState } from "react";
import { useRoom } from "@/lib/useRoom";
import { useCurrentQuestion } from "@/lib/useQuestion";
import { POWER_COSTS, PowerType } from "@/types/game";
import { PROFILES, getProfile, type Profile } from "@/lib/profiles";
import { Screen } from "@/components/design/Screen";
import { Panel, Pill } from "@/components/design/Panel";
import { CandyButton } from "@/components/design/CandyButton";
import { Avatar } from "@/components/design/Avatar";
import { ProfileTile } from "@/components/design/ProfileTile";
import { ArtImage } from "@/components/design/ArtImage";

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
  const { room, players, answers, loading, notFound } = useRoom(code);
  const [me, setMe] = useState<StoredPlayer | null>(null);
  const [joinError, setJoinError] = useState("");
  const [joiningName, setJoiningName] = useState<string | null>(null);
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

  const currentAnswers = useMemo(
    () =>
      room
        ? answers.filter((a) => a.round_index === room.current_round && a.question_index === room.current_question)
        : [],
    [answers, room?.current_round, room?.current_question]
  );

  async function join(name: string) {
    setJoinError("");
    setJoiningName(name);
    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: code, name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setJoinError(data.error);
      setJoiningName(null);
      return;
    }
    savePlayer(code, { id: data.player.id, name: data.player.name });
    setMe({ id: data.player.id, name: data.player.name });
    setJoiningName(null);
  }

  if (loading)
    return (
      <Screen>
        <Centered>
          <p className="animate-pulse font-display text-2xl text-text-secondary">Cargando…</p>
        </Centered>
      </Screen>
    );
  if (notFound || !room)
    return (
      <Screen>
        <Centered>
          <p className="font-display text-2xl text-danger">No existe la sala {code}</p>
        </Centered>
      </Screen>
    );

  if (!me || !myPlayer) {
    const takenNames = new Set(players.map((p) => p.name));
    return (
      <Screen>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center gap-6 px-5 py-10">
          <div className="flex flex-col items-center gap-2 text-center animate-pop-in">
            <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-lime">
              SALA {code}
            </p>
            <h1 className="font-display text-3xl">¿Quién sos vos?</h1>
            <p className="text-sm text-text-secondary">Tocá tu cara. Los grises ya fueron elegidos.</p>
          </div>
          <div className="grid w-full grid-cols-3 gap-3">
            {PROFILES.map((profile) => {
              const taken = takenNames.has(profile.name);
              const isJoining = joiningName === profile.name;
              return (
                <div key={profile.id} className={isJoining ? "animate-pulse" : ""}>
                  <ProfileTile
                    profile={profile}
                    avatarSize={60}
                    state={taken ? "locked" : "default"}
                    onClick={taken || joiningName ? undefined : () => join(profile.name)}
                  />
                </div>
              );
            })}
          </div>
          {joinError && <p className="text-sm text-danger">{joinError}</p>}
        </main>
      </Screen>
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

  const myProfile = getProfile(myPlayer.name);

  return (
    <Screen>
      <header className="flex items-center justify-between px-4 py-3">
        <span className="font-heading text-xs text-text-muted">{code}</span>
        <div className="flex items-center gap-2">
          <Avatar color={myProfile.color} emoji={myProfile.emoji} size={30} />
          <span className="font-heading text-sm font-bold">{myPlayer.name}</span>
        </div>
        <Pill tone="gold">⭐ {myPlayer.score}</Pill>
      </header>

      <RoleAndMissions code={code} player={myPlayer} phase={room.phase} />

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-6">
        {room.phase === "lobby" && (
          <LobbyWait code={code} me={myPlayer} myProfile={myProfile} players={players} />
        )}

        {room.phase === "roles" && (
          <Panel className="p-6 text-center">
            <p className="text-text-secondary">Esperá a que la pantalla principal arranque el Round 1.</p>
          </Panel>
        )}

        {room.phase === "question" &&
          question &&
          question.roundType !== "most-likely" &&
          (answered ? (
            <AnsweredPanel label="¡Respuesta enviada!" answeredCount={currentAnswers.length} players={players} />
          ) : (
            <ChoiceQuestionCard question={question} hiddenIndex={pistaHidden} onPick={submitChoice} />
          ))}

        {room.phase === "question" &&
          question &&
          question.roundType === "most-likely" &&
          (answered ? (
            <AnsweredPanel label="¡Voto enviado!" answeredCount={currentAnswers.length} players={players} />
          ) : (
            <MostLikelyCard prompt={question.prompt} players={players} onPick={submitVoteForMostLikely} />
          ))}

        {room.phase === "reveal" && question && (
          <div className="flex flex-col items-center gap-3 text-center">
            <Pill>{question.roundTitle}</Pill>
            <p className="font-display text-2xl">Mirá la pantalla principal 📺</p>
          </div>
        )}

        {room.phase === "shop" && (
          <ShopCard roomId={room.id} me={myPlayer} players={players} code={code} currentRound={room.current_round} />
        )}

        {room.phase === "final_vote" && <FinalVoteCard roomId={room.id} me={myPlayer} players={players} />}

        {room.phase === "results" && (
          <p className="text-center font-display text-2xl">🎉 ¡Gracias por jugar! Mirá la tele para los resultados.</p>
        )}
      </main>
    </Screen>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center p-6">{children}</div>;
}

function LobbyWait({
  code,
  me,
  myProfile,
  players,
}: {
  code: string;
  me: { name: string };
  myProfile: Profile;
  players: { name: string }[];
}) {
  const joinedNames = new Set(players.map((p) => p.name));
  const joinedCount = PROFILES.filter((p) => joinedNames.has(p.name)).length;

  return (
    <div className="flex w-full flex-col items-center gap-8 animate-pop-in">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-lime">SALA {code}</p>
        <Avatar color={myProfile.color} emoji={myProfile.emoji} size={130} animated />
        <h1 className="font-display text-2xl">¡Estás adentro, {me.name}!</h1>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>Esperando al anfitrión</span>
          <span className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-dot-pulse rounded-full bg-lime"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </span>
        </div>
      </div>

      <Panel className="w-full p-5">
        <p className="mb-4 font-display text-base">{joinedCount} DE 9 LISTOS</p>
        <div className="flex flex-wrap justify-between gap-2">
          {PROFILES.map((p) => (
            <Avatar
              key={p.id}
              color={joinedNames.has(p.name) ? p.color : "#2A1150"}
              emoji={joinedNames.has(p.name) ? p.emoji : "?"}
              size={30}
              dim={!joinedNames.has(p.name)}
            />
          ))}
        </div>
      </Panel>

      <p className="text-sm text-text-muted">💡 Tip: confiá en nadie.</p>
    </div>
  );
}

function AnsweredPanel({
  label,
  answeredCount,
  players,
}: {
  label: string;
  answeredCount: number;
  players: { name: string }[];
}) {
  const total = players.length || 1;
  const pct = Math.min(100, Math.round((answeredCount / total) * 100));
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center animate-pop-in">
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full text-5xl"
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(0,0,0,0.33)), #33E88E",
          boxShadow: "0 0 40px rgba(51,232,142,0.5), 0 8px 0 rgba(255,255,255,0.4)",
        }}
      >
        ✅
      </div>
      <div>
        <p className="font-display text-2xl">{label}</p>
        <p className="text-sm text-text-secondary">Ahora bancá al resto sin cantar tu voto 🤐</p>
      </div>
      <Panel className="w-full p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-display text-sm">RESPONDIERON</span>
          <span className="font-display text-sm text-lime">
            {answeredCount} / {players.length}
          </span>
        </div>
        <div className="h-3.5 overflow-hidden rounded-full bg-[#1B0B33]">
          <div
            className="h-full rounded-full bg-lime transition-all duration-500"
            style={{ width: `${pct}%`, boxShadow: "0 0 12px rgba(180,255,57,0.6)" }}
          />
        </div>
      </Panel>
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
      <div className="flex justify-center px-5 py-3">
        <CandyButton
          color="#FF3B5C"
          fullWidth={false}
          onClick={() => {
            window.localStorage.setItem(`revealed:${code}:${player.id}`, "1");
            setRevealed(true);
            setOpen(true);
          }}
        >
          Revelar mi rol
        </CandyButton>
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
    <div className="px-5 pb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-2"
      >
        <Pill tone={player.is_infiltrado ? "danger" : "neutral"}>
          {player.is_infiltrado ? "🕵️ Infiltrado" : "🙂 Civil"}
        </Pill>
        <span className="text-text-muted">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="flex flex-col items-center gap-4 pb-5 pt-2 text-center animate-pop-in">
          {player.is_infiltrado ? (
            <>
              <ArtImage src="/assets/mask.png" className="h-28 w-28 object-contain" />
              <p className="font-display text-2xl text-danger">SOS EL INFILTRADO</p>
              <p className="text-sm text-text-secondary">
                Mezclate, mentí y cumplí misiones sin que te agarren. Si sobrevivís, ganás.
              </p>
              <Panel className="w-full p-4 text-left">
                <p className="mb-3 text-center font-display text-base text-gold">MISIONES SECRETAS</p>
                {missions.length === 0 ? (
                  <p className="text-center text-sm text-text-muted">Cargando misiones…</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {missions.map((m) => {
                      const done = !!m.completed_at;
                      return (
                        <div
                          key={m.mission_index}
                          className={`flex items-center gap-3 rounded-2xl border-2 p-3 ${
                            done ? "border-good bg-good/15" : "border-surface-line bg-[#1B0B33]"
                          }`}
                        >
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${done ? "text-text-secondary line-through" : "text-text-primary"}`}>
                              {m.resolved_text}
                            </p>
                            <p className="text-xs font-bold text-gold">
                              {done ? "cumplida" : "+150 pts"}
                            </p>
                          </div>
                          {done ? (
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-good text-[#0A2A15]">
                              ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => completeMission(m.mission_index)}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-good text-good"
                              aria-label="Marcar cumplida"
                            >
                              ○
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>
            </>
          ) : (
            <>
              <span className="text-6xl">🙂</span>
              <p className="font-display text-2xl text-lime">SOS CIVIL</p>
              <p className="text-sm text-text-secondary">
                Disfrutá la noche y tratá de descubrir quién es el Infiltrado.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ChoiceQuestionCard({
  question,
  hiddenIndex,
  onPick,
}: {
  question: NonNullable<ReturnType<typeof useCurrentQuestion>>;
  hiddenIndex: number | null;
  onPick: (i: number) => void;
}) {
  const options = question.options ?? [];
  const peopleMode = options.length > 0 && options.every((o) => PROFILES.some((p) => p.name === o));

  return (
    <div className="flex w-full max-w-md flex-col gap-4 animate-pop-in">
      <div className="flex items-center justify-between">
        <Pill>{question.roundTitle}</Pill>
      </div>
      {question.imageUrl ? (
        <>
          <img src={question.imageUrl} alt="" className="mx-auto max-h-56 w-full rounded-3xl border-2 border-surface-line object-cover" />
          <p className="text-center font-display text-2xl">{question.prompt}</p>
        </>
      ) : (
        <div className="rounded-3xl border-2 border-surface-line bg-surface-2 p-4 shadow-lg">
          <p className="text-lg font-semibold italic">&ldquo;{question.prompt}&rdquo;</p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {options.map((opt, i) =>
          i === hiddenIndex ? (
            <div key={i} className="rounded-3xl border-2 border-surface-line bg-surface/40 py-3 text-center text-text-muted line-through">
              {opt}
            </div>
          ) : peopleMode ? (
            <button
              key={i}
              onClick={() => onPick(i)}
              className="flex items-center gap-3.5 rounded-3xl border-2 border-surface-line bg-surface p-2.5 pr-4 text-left transition-transform active:scale-[0.98]"
            >
              <Avatar color={getProfile(opt).color} emoji={getProfile(opt).emoji} size={48} />
              <span className="font-heading text-lg font-bold">{opt}</span>
            </button>
          ) : (
            <button
              key={i}
              onClick={() => onPick(i)}
              className="flex items-center gap-3 rounded-3xl border-2 border-surface-line bg-surface-2 p-3 pr-4 text-left transition-transform active:scale-[0.98]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/25 font-display text-base text-text-secondary">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="font-heading text-base font-semibold">{opt}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}

function MostLikelyCard({
  prompt,
  players,
  onPick,
}: {
  prompt: string;
  players: { id: string; name: string }[];
  onPick: (id: string) => void;
}) {
  return (
    <div className="flex w-full max-w-md flex-col gap-5 text-center animate-pop-in">
      <Pill>¿Quién es más probable que...?</Pill>
      <p className="font-display text-2xl">{prompt}</p>
      <div className="grid grid-cols-3 gap-2.5">
        {players.map((p) => (
          <ProfileTile key={p.id} profile={getProfile(p.name)} avatarSize={56} onClick={() => onPick(p.id)} />
        ))}
      </div>
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
    <div className="flex w-full max-w-md flex-col gap-4 animate-pop-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-2xl">TIENDA</p>
          <p className="text-xs text-text-secondary">Gastá o guardá. Vos sabrás.</p>
        </div>
        <Pill tone="gold">⭐ {me.score}</Pill>
      </div>
      {msg && <p className="text-center text-sm text-danger">{msg}</p>}
      <div className="flex flex-col gap-2.5">
        {(Object.keys(POWER_COSTS) as PowerType[]).map((power) => {
          const cost = POWER_COSTS[power];
          const needsTarget = power === "robo" || power === "bomba";
          const disabled = bought.has(power) || me.score < cost;
          return (
            <div key={power} className="rounded-3xl border-2 border-surface-line bg-surface p-3 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                  style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(0,0,0,0.2)), #FFC93C" }}
                >
                  {POWER_LABELS[power].emoji}
                </div>
                <div className="flex-1">
                  <p className="font-display text-base capitalize">{power}</p>
                  <p className="text-xs text-text-secondary">{POWER_LABELS[power].blurb}</p>
                </div>
                {!needsTarget || pendingTarget !== power ? (
                  <button
                    disabled={disabled}
                    onClick={() => (needsTarget ? setPendingTarget(power) : buy(power))}
                    className="flex shrink-0 items-center gap-1 rounded-2xl px-3.5 py-2.5 font-display text-sm text-[#123300] disabled:opacity-30"
                    style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(0,0,0,0.2)), #B4FF39" }}
                  >
                    ⭐ {bought.has(power) ? "OK" : cost}
                  </button>
                ) : null}
              </div>
              {needsTarget && pendingTarget === power && (
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {players
                    .filter((p) => p.id !== me.id)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => buy(power, p.id)}
                        className="rounded-xl border-2 border-surface-line bg-surface-2 py-1.5 text-xs font-semibold"
                      >
                        {p.name}
                      </button>
                    ))}
                </div>
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

  if (voted) {
    return (
      <div className="flex flex-col items-center gap-3 text-center animate-pop-in">
        <span className="text-5xl">🕵️</span>
        <p className="font-display text-2xl">Voto enviado.</p>
        <p className="text-sm text-text-secondary">Mirá la pantalla principal.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-5 text-center animate-pop-in">
      <p className="font-display text-2xl text-danger">¿Quién era EL INFILTRADO?</p>
      <p className="text-sm text-text-secondary">Elegí con cuidado. No hay revancha.</p>
      <div className="grid grid-cols-3 gap-2.5">
        {players
          .filter((p) => p.id !== me.id)
          .map((p) => (
            <ProfileTile key={p.id} profile={getProfile(p.name)} avatarSize={56} onClick={() => vote(p.id)} />
          ))}
      </div>
    </div>
  );
}
