"use client";
import { useEffect, useState } from "react";

export interface QuestionPayload {
  roundTitle: string;
  roundType: string;
  prompt: string;
  detail?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  options?: string[];
  correctIndex?: number | null;
}

export function useCurrentQuestion(
  roomId: string | undefined,
  phase: string | undefined,
  round: number | undefined,
  question: number | undefined
) {
  const [data, setData] = useState<QuestionPayload | null>(null);

  useEffect(() => {
    if (!roomId || (phase !== "question" && phase !== "reveal")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpiar al salir de la pregunta
      setData(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/question?roomId=${roomId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, phase, round, question]);

  return data;
}
