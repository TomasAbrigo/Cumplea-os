// Contenido real de "La Noche de los 9", curado del chat de WhatsApp del grupo.
// Ver TODOs: Round 2 (fotos) y las anécdotas completas de Round 5 quedan
// pendientes de que Tomi las termine de curar antes del evento.

export type RoundType =
  | "who-said-it"
  | "photo"
  | "most-likely"
  | "stats"
  | "lost-context";

export interface ChoiceQuestion {
  id: string;
  prompt: string; // la frase, foto o dato que se muestra
  detail?: string; // texto chico opcional (ej. fuente del dato)
  options: string[];
  correctIndex: number;
  imageUrl?: string;
}

export interface MostLikelyQuestion {
  id: string;
  prompt: string;
}

export interface Round {
  index: number;
  key: string;
  type: RoundType;
  title: string;
  subtitle: string;
  questions: ChoiceQuestion[] | MostLikelyQuestion[];
}

// Los 6 protagonistas con historial real en el chat (de los 9 jugadores totales).
export const CHAT_PEOPLE = ["Juampi", "Franco", "Lucas", "Joaco", "Mati", "Tomi"];

const round1: Round = {
  index: 0,
  key: "quien-dijo-esto",
  type: "who-said-it",
  title: "¿Quién dijo esto?",
  subtitle: "Mensaje real del chat, sin autor. Adiviná quién lo escribió.",
  questions: [
    {
      id: "r1q1",
      prompt:
        "“El podrá ser un pajero, un hijo de mil putas, un asesino serial del humor, un pibe con una hermosa familia femenina”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Lucas"),
    },
    {
      id: "r1q2",
      prompt: "“Porque el que duerma conmigo le voy a romper el orto”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Franco"),
    },
    {
      id: "r1q3",
      prompt: "“Yo a Juampi lo voy a matar sinceramente”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Tomi"),
    },
    {
      id: "r1q4",
      prompt: "“Q daria gusto reventarles la cabeza”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Joaco"),
    },
    {
      id: "r1q5",
      prompt: "“Que puto asqueroso”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Mati"),
    },
    {
      id: "r1q6",
      prompt: "“Decile que la reconcha de su madre”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Juampi"),
    },
    {
      id: "r1q7",
      prompt: "“Pero sos un cáncer”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Franco"),
    },
    {
      id: "r1q8",
      prompt: "“Ojalá se mueran los de las pastillas”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Tomi"),
    },
  ],
};

// TODO(Tomi): reemplazar imageUrl por las fotos reales elegidas del zip de WhatsApp
// (ponerlas en /public/round2/ y actualizar las rutas + la respuesta correcta).
const round2: Round = {
  index: 1,
  key: "archivo-historico",
  type: "photo",
  title: "Archivo histórico",
  subtitle: "Foto real del chat, recortada o con zoom. ¿Quién, dónde o qué es?",
  questions: [
    {
      id: "r2q1",
      prompt: "PENDIENTE: elegir foto real #1 del zip",
      imageUrl: "/round2/placeholder-1.svg",
      options: CHAT_PEOPLE,
      correctIndex: 0,
    },
    {
      id: "r2q2",
      prompt: "PENDIENTE: elegir foto real #2 del zip",
      imageUrl: "/round2/placeholder-2.svg",
      options: CHAT_PEOPLE,
      correctIndex: 0,
    },
    {
      id: "r2q3",
      prompt: "PENDIENTE: elegir foto real #3 del zip",
      imageUrl: "/round2/placeholder-3.svg",
      options: CHAT_PEOPLE,
      correctIndex: 0,
    },
  ],
};

const round3: Round = {
  index: 2,
  key: "mas-probable-que",
  type: "most-likely",
  title: "¿Quién es más probable que...?",
  subtitle: "Votá en secreto. Puntos si tu voto coincide con la mayoría.",
  questions: [
    { id: "r3q1", prompt: "¿Quién es más probable que termine la noche llorando de risa?" },
    { id: "r3q2", prompt: "¿Quién es más probable que se quede dormido primero?" },
    { id: "r3q3", prompt: "¿Quién es más probable que arme quilombo por nada?" },
    { id: "r3q4", prompt: "¿Quién es más probable que hable de laburo en medio de la joda?" },
    { id: "r3q5", prompt: "¿Quién es más probable que le mande un audio de 5 minutos a alguien que no lo pidió?" },
    { id: "r3q6", prompt: "¿Quién es más probable que termine bailando solo?" },
    { id: "r3q7", prompt: "¿Quién es más probable que se olvide este cumpleaños el año que viene?" },
    { id: "r3q8", prompt: "¿Quién es más probable que diga algo que después tenga que borrar del chat?" },
  ],
};

const round4: Round = {
  index: 3,
  key: "estadisticas-del-grupo",
  type: "stats",
  title: "Estadísticas del grupo",
  subtitle: "Dato real del chat. Adiviná a quién corresponde.",
  questions: [
    {
      id: "r4q1",
      prompt: "Manda más mensajes por lejos: 22.353 de los 74.000 totales del grupo",
      detail: "conteo real del chat",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Franco"),
    },
    {
      id: "r4q2",
      prompt: "Una IA que el grupo consultó lo describió como “el organizador”: el que arma los planes y etiqueta a todos",
      detail: "perfil de IA, 26/6/26",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Mati"),
    },
    {
      id: "r4q3",
      prompt: "La misma IA lo calificó como “el caótico” del grupo",
      detail: "perfil de IA, 26/6/26",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Joaco"),
    },
    {
      id: "r4q4",
      prompt: "La IA lo describió como “el observador que aparece con comentarios inesperados”",
      detail: "perfil de IA, 26/6/26",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Lucas"),
    },
    {
      id: "r4q5",
      prompt: "Ranking “quién más suele tener razón” según la IA: 1° puesto, con 60%",
      detail: "perfil de IA, 26/6/26",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Mati"),
    },
    {
      id: "r4q6",
      prompt: "En ese mismo ranking, quedó último con 25%",
      detail: "perfil de IA, 26/6/26",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Joaco"),
    },
    {
      id: "r4q7",
      prompt: "La IA lo señaló como “el que más insulta” del grupo",
      detail: "perfil de IA, 26/6/26",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Franco"),
    },
    {
      id: "r4q8",
      prompt: "El que más se ríe: 773 “jaja” en apenas 6.369 mensajes propios",
      detail: "conteo real del chat",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Tomi"),
    },
  ],
};

const round5: Round = {
  index: 4,
  key: "contexto-perdido",
  type: "lost-context",
  title: "Contexto perdido",
  subtitle: "Mensaje real, sin autor ni fecha. ¿De qué anécdota o evento viene?",
  questions: [
    {
      id: "r5q1",
      prompt: "“Yo no tomo hasta el Cosquín”",
      options: ["Copa Galaxy", "Cosquín Rock", "Trámite ESTA / viaje a EE.UU.", "Moncholo FC"],
      correctIndex: 1,
    },
    {
      id: "r5q2",
      prompt: "“-TORNEO APERTURA 2025- Domingos / Copa Galaxy ⚽️”",
      options: ["Copa Galaxy", "Cosquín Rock", "Trámite ESTA / viaje a EE.UU.", "Moncholo FC"],
      correctIndex: 0,
    },
    {
      id: "r5q3",
      prompt: "“Official ESTA Application Website, U.S. Customs and Border Protection Document.pdf”",
      options: ["Copa Galaxy", "Cosquín Rock", "Trámite ESTA / viaje a EE.UU.", "Moncholo FC"],
      correctIndex: 2,
    },
    {
      id: "r5q4",
      prompt: "“Moncholo FC - Torneo Clausura CG.xlsx”",
      options: ["Copa Galaxy", "Cosquín Rock", "Trámite ESTA / viaje a EE.UU.", "Moncholo FC"],
      correctIndex: 3,
    },
  ],
};

export const ROUNDS: Round[] = [round1, round2, round3, round4, round5];

export function getRound(index: number): Round | undefined {
  return ROUNDS.find((r) => r.index === index);
}

// Preguntas de desempate en vivo, por si dos jugadores empatan el 1er puesto.
export const TIEBREAK_QUESTIONS: ChoiceQuestion[] = [
  {
    id: "tb1",
    prompt: "Según el chat, ¿quién mandó más adjuntos (fotos/videos/audios) en total?",
    options: CHAT_PEOPLE,
    correctIndex: CHAT_PEOPLE.indexOf("Juampi"),
  },
  {
    id: "tb2",
    prompt: "¿Quién usa más el emoji ⚽ en el chat?",
    options: CHAT_PEOPLE,
    correctIndex: CHAT_PEOPLE.indexOf("Franco"),
  },
];
