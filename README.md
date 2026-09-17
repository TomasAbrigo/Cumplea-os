# La Noche de los 9

Game show casero para el cumpleaños de Tomi. Nueve jugadores, un solo puntaje
real por persona (sin equipos), y El Infiltrado corriendo en paralelo toda la
noche.

Ver el [documento de diseño completo](https://claude.ai/code/artifact/0a0e3840-d012-4b3a-b41d-ab7f9b4a6a4d)
para reglas, rounds, tienda y mecánica del Infiltrado.

## Cómo se juega

- Una notebook conectada a la TV corre `/host/[código]` — la pantalla principal.
- Cada jugador entra desde su celular a `/play/[código]`.
- El host controla todo: arranca la partida, muestra respuestas y avanza rounds.

## Stack

- Next.js (App Router) + Tailwind
- Postgres + Realtime de Supabase (vía Vercel Marketplace)
- Todas las mutaciones de juego pasan por rutas de API server-side (nunca el
  cliente escribe directo a la base), y el contenido con respuestas correctas
  nunca se manda al navegador hasta el momento del reveal.

## Jugar solo (testeo)

Desde el lobby del host hay un botón **"🤖 Sumar 2 bots"**. Los bots se suman
como jugadores normales, responden solos apenas arranca cada pregunta (al
azar) y votan solos en la acusación final — así podés probar todo el flujo
(rounds, tienda, Infiltrado, votación final) entrando como el único jugador
real desde tu celular o desde otra pestaña. El sorteo del Infiltrado siempre
recae en una persona real cuando hay alguna, nunca en un bot.

## Desarrollo local

```bash
npm install
npm run dev
```

Las variables de entorno (Supabase/Postgres) ya están provistas por la
integración de Vercel — corré `vercel env pull` si hace falta refrescar
`.env.local`.

### Aplicar cambios de schema

Editar `supabase/schema.sql` (es idempotente) y correr:

```bash
node scripts/migrate.mjs
```

## Los 6 rounds

1. **¿Quién dijo esto?** (16 preguntas) — mensajes reales sin autor.
2. **Archivo histórico** (3) — Spotify Wrapped real de Franco, Juampi y Mati,
   compartidos en el chat el 3/12/25.
3. **¿Quién es más probable que...?** (8) — votación en vivo, con escenarios
   concretos armados con referencias 100% reales del grupo (Moncholo, el
   boteo, el prode, "estar fisura"), no categorías genéricas.
4. **Estadísticas del grupo** (8) — datos reales del chat + el perfil de IA.
5. **¿Real o inventado?** (8) — mitad son mensajes 100% reales del chat,
   mitad los inventé imitando el tono y la sintaxis desprolija real del grupo
   (usando nombres/referencias reales: el pelado, la Agus, Kenai, Nico).
6. **¿Qué carajo estoy escuchando?** (6) — audio real de WhatsApp por
   persona, elegido por reacciones reales de risa en el chat alrededor de
   cada uno. Solo suena en la pantalla principal (host toca "Reproducir"),
   los celus responden igual. Usa `.ogg` (no `.opus`) para que el servidor
   sirva el `Content-Type` correcto — ver nota abajo.

### Nota técnica: por qué `.ogg` y no `.opus`

Los audios de WhatsApp exportados son Ogg-Opus real, pero Next.js sirve
archivos `.opus` desde `/public` con `Content-Type: application/octet-stream`
(no reconoce la extensión), lo que rompe la reproducción en el navegador.
Renombrarlos a `.ogg` (mismo contenido, mismo contenedor) hace que se sirvan
como `audio/ogg` y reproducen bien en Chrome sin convertir nada.

## Pendientes antes del evento

1. Revisar el tono final de los mensajes "cancelables" del Round 1 antes de
   la noche del evento.
2. Escuchar los 6 audios de Round 6 vos mismo (Claude no puede "escuchar"
   para verificar contenido/calidad) y avisar si alguno hay que cambiar —
   sobre todo el de Mati, que fue el que menos reacción de risa tenía
   alrededor en el chat.
