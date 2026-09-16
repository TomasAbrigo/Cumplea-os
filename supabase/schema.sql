-- La Noche de los 9 — schema
-- Contenido de rounds/misiones vive en el código (src/content); estas tablas
-- guardan únicamente el estado vivo de una partida.

create extension if not exists pgcrypto;

create table if not exists rooms (
  id text primary key,                         -- código de sala, ej "TOMI25"
  status text not null default 'lobby',        -- lobby | playing | finished
  phase text not null default 'lobby',         -- lobby | question | reveal | shop | final_vote | results
  current_round int not null default 0,
  current_question int not null default 0,
  question_started_at timestamptz,
  infiltrado_player_id uuid,
  tiebreak_player_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table rooms add column if not exists tiebreak_player_ids uuid[] not null default '{}';

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  name text not null,
  score int not null default 0,
  infiltrado_points int not null default 0,
  is_infiltrado boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (room_id, name)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'rooms_infiltrado_fk'
  ) then
    alter table rooms
      add constraint rooms_infiltrado_fk foreign key (infiltrado_player_id)
      references players(id) on delete set null;
  end if;
end $$;

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  round_index int not null,
  question_index int not null,
  choice int,
  choice_player_id uuid references players(id) on delete set null,
  is_correct boolean not null default false,
  points_awarded int not null default 0,
  response_ms int not null,
  answered_at timestamptz not null default now(),
  unique (player_id, round_index, question_index)
);

alter table answers add column if not exists choice_player_id uuid references players(id) on delete set null;
alter table answers alter column choice drop not null;
alter table answers alter column is_correct set default false;

create table if not exists power_uses (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  power_type text not null,                    -- duplicador | escudo | robo | pista | bomba
  target_player_id uuid references players(id) on delete set null,
  used_at timestamptz not null default now(),
  consumed boolean not null default false
);

create table if not exists mission_progress (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  mission_index int not null,
  mission_key text not null default '',
  resolved_text text not null default '',
  completed_at timestamptz,
  unique (player_id, mission_index)
);

alter table mission_progress add column if not exists mission_key text not null default '';
alter table mission_progress add column if not exists resolved_text text not null default '';

create table if not exists final_votes (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  voter_id uuid not null references players(id) on delete cascade,
  suspect_id uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (voter_id)
);

-- Realtime: publicar cambios para que host y jugadores se sincronicen en vivo.
do $$
declare
  t text;
begin
  foreach t in array array['rooms','players','answers','power_uses','mission_progress','final_votes']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

-- RLS: app privada sin cuentas de usuario (se entra con código de sala).
-- Se habilita RLS por buena práctica, con políticas abiertas a anon/authenticated,
-- que es el modelo de acceso real de esta app (link no listado, sin login).
alter table rooms enable row level security;
alter table players enable row level security;
alter table answers enable row level security;
alter table power_uses enable row level security;
alter table mission_progress enable row level security;
alter table final_votes enable row level security;

drop policy if exists "rooms_all" on rooms;
create policy "rooms_all" on rooms for all to anon, authenticated using (true) with check (true);

drop policy if exists "players_all" on players;
create policy "players_all" on players for all to anon, authenticated using (true) with check (true);

drop policy if exists "answers_all" on answers;
create policy "answers_all" on answers for all to anon, authenticated using (true) with check (true);

drop policy if exists "power_uses_all" on power_uses;
create policy "power_uses_all" on power_uses for all to anon, authenticated using (true) with check (true);

drop policy if exists "mission_progress_all" on mission_progress;
create policy "mission_progress_all" on mission_progress for all to anon, authenticated using (true) with check (true);

drop policy if exists "final_votes_all" on final_votes;
create policy "final_votes_all" on final_votes for all to anon, authenticated using (true) with check (true);
