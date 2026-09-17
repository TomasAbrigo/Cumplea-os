"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Screen } from "@/components/design/Screen";
import { Panel } from "@/components/design/Panel";
import { CandyButton } from "@/components/design/CandyButton";
import { ArtImage } from "@/components/design/ArtImage";

const CODE_LENGTH = 5;

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function createRoom() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/room", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/host/${data.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error creando la sala");
      setCreating(false);
    }
  }

  function join() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    router.push(`/play/${code}`);
  }

  return (
    <Screen>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-between gap-8 px-6 py-10">
        <div className="flex flex-col items-center gap-1 animate-pop-in">
          <ArtImage src="/assets/hero9.png" className="h-40 w-40 object-contain animate-float-a" />
          <h1 className="text-center font-display text-4xl leading-tight text-text-primary">
            LA NOCHE
          </h1>
          <h1 className="flex items-center gap-2.5 font-display text-4xl leading-tight">
            <span className="text-text-primary">DE LOS</span>
            <span className="text-lime text-5xl">9</span>
          </h1>
          <p className="mt-1 text-center font-heading text-sm font-medium text-text-secondary">
            9 amigos · 1 infiltrado · 0 piedad
          </p>
        </div>

        <div className="flex w-full flex-col gap-5">
          <Panel className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="font-display text-lg text-cyan">Pantalla principal (TV)</p>
            <p className="text-sm text-text-secondary">
              Creá la sala desde acá y dejá esta pantalla en la TV o notebook.
            </p>
            <CandyButton color="#00E5FF" onClick={createRoom} disabled={creating}>
              {creating ? "CREANDO…" : "CREAR SALA"}
            </CandyButton>
          </Panel>

          <Panel className="flex flex-col items-center gap-4 p-6">
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
              Código de sala
            </p>
            <div className="relative">
              <div className="flex justify-center gap-2.5">
                {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                  const active = i === joinCode.length;
                  return (
                    <div
                      key={i}
                      className={`flex h-14 w-11 items-center justify-center rounded-2xl border-2 font-display text-2xl ${
                        active
                          ? "border-lime bg-[#1B0B33] text-lime"
                          : "border-surface-line bg-surface-2 text-text-primary"
                      }`}
                    >
                      {joinCode[i] ?? (active ? "|" : "")}
                    </div>
                  );
                })}
              </div>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, CODE_LENGTH))}
                onKeyDown={(e) => e.key === "Enter" && join()}
                maxLength={CODE_LENGTH}
                autoCapitalize="characters"
                aria-label="Código de sala"
                className="absolute inset-0 opacity-0"
              />
            </div>
            <CandyButton color="#B4FF39" onClick={join} disabled={!joinCode}>
              ENTRAR A LA SALA
            </CandyButton>
            {error && <p className="text-sm text-danger">{error}</p>}
            <p className="text-xs text-text-muted">¿No tenés código? Miralo en la tele 📺</p>
          </Panel>
        </div>
      </main>
    </Screen>
  );
}
