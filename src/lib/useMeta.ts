"use client";
import { useEffect, useState } from "react";

export interface RoundMeta {
  index: number;
  key: string;
  title: string;
  subtitle: string;
  type: string;
  count: number;
}

export interface Meta {
  rounds: RoundMeta[];
  tiebreakCount: number;
}

let cache: Meta | null = null;

export function useMeta() {
  const [meta, setMeta] = useState<Meta | null>(cache);
  useEffect(() => {
    if (cache) return;
    fetch("/api/meta")
      .then((r) => r.json())
      .then((d) => {
        cache = d;
        setMeta(d);
      });
  }, []);
  return meta;
}
