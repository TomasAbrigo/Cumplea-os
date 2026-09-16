"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "./supabaseClient";
import type { Room, Player, Answer, FinalVote } from "@/types/game";

export function useRoom(code: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [votes, setVotes] = useState<FinalVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/room?code=${code}`);
    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setRoom(data.room);
    setPlayers(data.players);
    setLoading(false);
  }, [code]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch inicial al montar
    refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`room-${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${code}` },
        (payload) => setRoom(payload.new as Room)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${code}` },
        (payload) => {
          setPlayers((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((p) => p.id !== (payload.old as Player).id);
            }
            const updated = payload.new as Player;
            const exists = prev.some((p) => p.id === updated.id);
            return exists
              ? prev.map((p) => (p.id === updated.id ? updated : p))
              : [...prev, updated];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "answers", filter: `room_id=eq.${code}` },
        (payload) => {
          const updated = payload.new as Answer;
          setAnswers((prev) => {
            const exists = prev.some((a) => a.id === updated.id);
            return exists ? prev.map((a) => (a.id === updated.id ? updated : a)) : [...prev, updated];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "final_votes", filter: `room_id=eq.${code}` },
        (payload) => {
          setVotes((prev) => [...prev, payload.new as FinalVote]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code]);

  return { room, players, answers, votes, loading, notFound, refresh };
}
