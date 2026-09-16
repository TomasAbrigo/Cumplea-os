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

## Pendientes antes del evento

1. **Archivo histórico**: ya cargado con 3 Spotify Wrapped reales que Franco,
   Juampi y Mati compartieron en el chat (3/12/25) — autoría confirmada por
   el propio mensaje de cada uno. Si Tomi prefiere otras fotos, reemplazar en
   `/public/round2/` y ajustar `src/content/rounds.ts`.
2. **Contexto perdido**: los 4 mensajes ya están cargados con su evento
   correcto (Copa Galaxy / Cosquín Rock / ESTA / Moncholo FC) — no requiere
   más trabajo salvo que Tomi quiera sumar más anécdotas.
3. Revisar el tono final de los mensajes "cancelables" del Round 1 antes de
   la noche del evento.
