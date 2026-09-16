"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 px-6 py-16 bg-neutral-950 text-neutral-50">
      <div className="text-center space-y-2">
        <p className="uppercase tracking-[0.3em] text-amber-400 text-xs font-bold">
          Cumpleaños de Tomi
        </p>
        <h1 className="text-5xl sm:text-6xl font-black uppercase tracking-tight">
          La Noche
          <br />
          de los 9
        </h1>
      </div>

      <div className="w-full max-w-sm space-y-8">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="font-bold uppercase tracking-wide text-sm text-amber-400">
            Pantalla principal (TV)
          </h2>
          <p className="text-sm text-neutral-400">
            Creá la sala desde acá y dejá esta pantalla en la TV o notebook.
          </p>
          <button
            onClick={createRoom}
            disabled={creating}
            className="w-full rounded-md bg-amber-500 text-neutral-950 font-bold py-3 uppercase tracking-wide hover:bg-amber-400 disabled:opacity-50"
          >
            {creating ? "Creando..." : "Crear sala"}
          </button>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="font-bold uppercase tracking-wide text-sm text-red-400">
            Jugador (celular)
          </h2>
          <p className="text-sm text-neutral-400">Ingresá el código que muestra la TV.</p>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="CÓDIGO"
            maxLength={6}
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-3 text-center text-xl tracking-[0.3em] font-mono uppercase outline-none focus:border-red-400"
          />
          <button
            onClick={join}
            className="w-full rounded-md bg-red-500 text-neutral-950 font-bold py-3 uppercase tracking-wide hover:bg-red-400"
          >
            Unirme
          </button>
        </div>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    </div>
  );
}
