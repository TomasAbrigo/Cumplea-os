// Misiones de El Infiltrado. "{target}" se reemplaza por el nombre de otro
// jugador elegido al azar cuando arranca la partida.

export interface MissionTemplate {
  key: string;
  text: string;
  needsTarget: boolean;
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  { key: "laburo", text: 'Conseguí que {target} diga la palabra "laburo".', needsTarget: true },
  { key: "galeria", text: "Lográ que alguien te muestre una foto de su galería.", needsTarget: false },
  { key: "brindis", text: "Hacé que alguien proponga un brindis.", needsTarget: false },
  { key: "anecdota", text: "Hacé que {target} cuente una anécdota vergonzosa suya.", needsTarget: true },
  { key: "cancion", text: "Lográ que el grupo cante o tararee una canción entera.", needsTarget: false },
  { key: "celular", text: 'Conseguí que alguien te preste el celular "un segundo".', needsTarget: false },
];

export function resolveMissionText(text: string, targetName: string): string {
  return text.replace("{target}", targetName);
}
