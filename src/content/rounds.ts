// Contenido real de "La Noche de los 9", curado del chat de WhatsApp del grupo.

export type RoundType =
  | "who-said-it"
  | "photo"
  | "most-likely"
  | "stats"
  | "real-or-fake"
  | "audio";

export interface ChoiceQuestion {
  id: string;
  prompt: string; // la frase, foto o dato que se muestra
  detail?: string; // texto chico opcional (ej. fuente del dato)
  options: string[];
  correctIndex: number;
  imageUrl?: string;
  audioUrl?: string;
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
      prompt: "“Ojalá se mueran los de las pastillas”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Tomi"),
    },
    {
      id: "r1q4",
      prompt: "“Que ninguna puta de re mierda te saque tu brillo 10 🪄”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Franco"),
    },
    {
      id: "r1q5",
      prompt: "“Pero de seguir un trolazo putazo y justificarlo diciendo q no querías”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Franco"),
    },
    {
      id: "r1q6",
      prompt: "“Q te haces el amigo mentiroso guarro hijo de la lujuria y la deshonestidad”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Joaco"),
    },
    {
      id: "r1q7",
      prompt: "“Colgué un gallo decapitado afuera de su casa y le regalé un gauchito gil al padre”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Tomi"),
    },
    {
      id: "r1q8",
      prompt: "“Tengo el cuádriceps de un toro culiao”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Lucas"),
    },
    {
      id: "r1q9",
      prompt: "“Tímido, cagón y seductor”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Juampi"),
    },
    {
      id: "r1q10",
      prompt: "“Grandote, supo ser bueno, infiel, subcampeón”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Juampi"),
    },
    {
      id: "r1q11",
      prompt: "“Mañana merca en lo del pelado?”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Lucas"),
    },
    {
      id: "r1q12",
      prompt: "“Boludo es increíble, me debería haber hecho de Belgrano, insostenible ser de Talleres”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Lucas"),
    },
    {
      id: "r1q13",
      prompt: "“No sé qué hacer con un sueldo de 65 millones”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Joaco"),
    },
    {
      id: "r1q14",
      prompt: "“Pajearse sin meterse un dedo en el culo es como jugar a la play sin joystick”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Juampi"),
    },
    {
      id: "r1q15",
      prompt: "“El que inventó el trabajo es un hijo de mil puta”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Mati"),
    },
    {
      id: "r1q16",
      prompt: "“Devolveme la otra parte de la nena, hijo de puta”",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Mati"),
    },
  ],
};

// Las 3 fotos son capturas reales de Spotify Wrapped que cada uno compartió
// en el chat el 3/12/25 (mismo hilo, uno atrás del otro). Autoría confirmada
// por el propio mensaje de cada uno ("si te muestro el mio", "yo soy re hombre").
const round2: Round = {
  index: 1,
  key: "archivo-historico",
  type: "photo",
  title: "Archivo histórico",
  subtitle: "Wrapped real del chat (dic. 2025). ¿De quién es?",
  questions: [
    {
      id: "r2q1",
      prompt: "Top 1: Yami Safdie. 23.896 minutos escuchados. Género principal: Rock latino.",
      imageUrl: "/round2/wrapped-franco.jpg",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Franco"),
    },
    {
      id: "r2q2",
      prompt: "76.272 minutos escuchados en el año. Eso equivale a 52 días enteros de música.",
      imageUrl: "/round2/wrapped-juampi.jpg",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Juampi"),
    },
    {
      id: "r2q3",
      prompt: "Top 1: Las Pastillas del Abuelo. 28.942 minutos escuchados. Género principal: Rock latino.",
      imageUrl: "/round2/wrapped-mati.jpg",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Mati"),
    },
  ],
};

// No son categorías genéricas ("el gracioso", "el caótico") sino escenarios
// concretos armados con objetos y referencias 100% reales del grupo (Moncholo,
// el boteo, el prode, "fisura", los prestamos que nunca vuelven).
const round3: Round = {
  index: 2,
  key: "mas-probable-que",
  type: "most-likely",
  title: "¿Quién es más probable que...?",
  subtitle: "Votá en secreto. Puntos si tu voto coincide con la mayoría.",
  questions: [
    {
      id: "r3q1",
      prompt: "¿Quién es más probable que llegue tarde a Moncholo por quedarse dormido después de la previa?",
    },
    {
      id: "r3q2",
      prompt: "¿Quién es más probable que se olvide del boteo hasta el último día y aparezca pidiendo plata a las corridas?",
    },
    {
      id: "r3q3",
      prompt: "¿Quién es más probable que le erre a un prode fácil y lo siga jugando como si nada?",
    },
    {
      id: "r3q4",
      prompt: "¿Quién es más probable que se enoje en serio por una jugada de Moncholo y la siga hablando una semana después?",
    },
    {
      id: "r3q5",
      prompt: "¿Quién es más probable que te devuelva algo que le prestaste roto, o directamente nunca?",
    },
    {
      id: "r3q6",
      prompt: "¿Quién es más probable que arranque una discusión de política picante en medio de la joda?",
    },
    {
      id: "r3q7",
      prompt: "¿Quién es más probable que diga que 'está fisura' con algo sin tener la menor idea de qué está hablando?",
    },
    {
      id: "r3q8",
      prompt: "¿Quién es más probable que cancele un plan a último momento con una excusa elaboradísima?",
    },
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

// Mitad mensajes 100% reales del chat (verificados, textual), mitad inventados
// por Claude imitando el tono del grupo. La gracia es que a veces lo real
// suena más falso que lo inventado.
const REAL_OR_FAKE_OPTIONS = ["Real", "Inventado"];
const round5: Round = {
  index: 4,
  key: "real-o-inventado",
  type: "real-or-fake",
  title: "¿Real o inventado?",
  subtitle: "Mitad son mensajes reales del chat. La otra mitad me los inventé yo. ¿Cuál es cuál?",
  questions: [
    {
      id: "r5q1",
      prompt: "“No sé cómo mierda hizo Garro para matar a un tipo, boludo”",
      options: REAL_OR_FAKE_OPTIONS,
      correctIndex: 0, // real
    },
    {
      id: "r5q2",
      prompt: "“El pelado dice que si Colapinto no entra a Q3 se va a vivir a la loma del orto”",
      options: REAL_OR_FAKE_OPTIONS,
      correctIndex: 1, // inventado
    },
    {
      id: "r5q3",
      prompt: "“La Agus le mandó captura a todos menos a mí y ahora estoy re digno”",
      options: REAL_OR_FAKE_OPTIONS,
      correctIndex: 1, // inventado
    },
    {
      id: "r5q4",
      prompt: "“Y le rompen el orto al puto pecho frío helado cagón de Piastri”",
      options: REAL_OR_FAKE_OPTIONS,
      correctIndex: 0, // real
    },
    {
      id: "r5q5",
      prompt: "“Kenai me preguntó quién era yo y alguien le dijo que el que paga la previa”",
      options: REAL_OR_FAKE_OPTIONS,
      correctIndex: 1, // inventado
    },
    {
      id: "r5q6",
      prompt: "“Q culia como me mandan a mí primero al muere después de la seguidilla de fisuras”",
      options: REAL_OR_FAKE_OPTIONS,
      correctIndex: 0, // real
    },
    {
      id: "r5q7",
      prompt: "“Qué feo que no te acuerdes que fuiste el primero en traicionar”",
      options: REAL_OR_FAKE_OPTIONS,
      correctIndex: 0, // real
    },
    {
      id: "r5q8",
      prompt: "“Nico se equivocó de grupo y mandó el audio ahí nomás sin darse cuenta”",
      options: REAL_OR_FAKE_OPTIONS,
      correctIndex: 1, // inventado
    },
  ],
};

// Audios reales de WhatsApp (elegidos por reacciones reales de risa en el chat
// alrededor de cada uno). Suena por los parlantes de la TV/notebook — el host
// toca "Reproducir", los celus solo muestran las opciones.
const round6: Round = {
  index: 5,
  key: "que-carajo-escucho",
  type: "audio",
  title: "¿Qué carajo estoy escuchando?",
  subtitle: "Audio real de WhatsApp. Escuchalo en la pantalla principal. ¿Quién es?",
  questions: [
    {
      id: "r6q1",
      prompt: "🔊 Escuchá el audio en la pantalla principal",
      audioUrl: "/audio/audio-franco.ogg",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Franco"),
    },
    {
      id: "r6q2",
      prompt: "🔊 Escuchá el audio en la pantalla principal",
      audioUrl: "/audio/audio-juampi.ogg",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Juampi"),
    },
    {
      id: "r6q3",
      prompt: "🔊 Escuchá el audio en la pantalla principal",
      audioUrl: "/audio/audio-lucas.ogg",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Lucas"),
    },
    {
      id: "r6q4",
      prompt: "🔊 Escuchá el audio en la pantalla principal",
      audioUrl: "/audio/audio-joaco.ogg",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Joaco"),
    },
    {
      id: "r6q5",
      prompt: "🔊 Escuchá el audio en la pantalla principal",
      audioUrl: "/audio/audio-mati.ogg",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Mati"),
    },
    {
      id: "r6q6",
      prompt: "🔊 Escuchá el audio en la pantalla principal",
      audioUrl: "/audio/audio-tomi.ogg",
      options: CHAT_PEOPLE,
      correctIndex: CHAT_PEOPLE.indexOf("Tomi"),
    },
  ],
};

export const ROUNDS: Round[] = [round1, round2, round3, round4, round5, round6];

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
