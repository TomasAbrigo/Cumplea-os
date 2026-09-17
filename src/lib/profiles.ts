export interface Profile {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const PROFILES: Profile[] = [
  { id: "tomi", name: "Tomi", emoji: "🦊", color: "#FF2E93" },
  { id: "juampi", name: "Juampi", emoji: "🐸", color: "#00E5FF" },
  { id: "mati", name: "Mati", emoji: "🦁", color: "#B4FF39" },
  { id: "joaco", name: "Joaco", emoji: "🐵", color: "#FF6B35" },
  { id: "franco", name: "Franco", emoji: "🐙", color: "#9D4EDD" },
  { id: "lucas", name: "Lucas", emoji: "🐯", color: "#FFC93C" },
  { id: "martisar", name: "Marti Sar", emoji: "🦄", color: "#2EE6A6" },
  { id: "martisaav", name: "Marti Saav", emoji: "🐲", color: "#FF5C7A" },
  { id: "agus", name: "Agus", emoji: "🐧", color: "#4D7CFF" },
];

export const FALLBACK_PROFILE: Profile = {
  id: "bot",
  name: "?",
  emoji: "🤖",
  color: "#5A4A78",
};

export function getProfile(name: string | undefined | null): Profile {
  if (!name) return FALLBACK_PROFILE;
  return PROFILES.find((p) => p.name === name) ?? { ...FALLBACK_PROFILE, name };
}
