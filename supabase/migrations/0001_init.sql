-- Schéma initial : joueurs, matchs et classements/rankings selon le règlement
-- fédéral C700 (FRBB/LFBB/BV). Lecture publique, écriture réservée aux admins.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles : rôle applicatif associé à un compte Supabase Auth.
-- Un nouveau compte n'a AUCUN privilège par défaut ('pending') ; seul un
-- superadmin peut promouvoir quelqu'un en 'admin'.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'pending' check (role in ('pending', 'admin', 'superadmin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = uid and role in ('admin', 'superadmin')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profiles_superadmin_write"
  on public.profiles for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));

-- ---------------------------------------------------------------------------
-- players
-- ---------------------------------------------------------------------------
create table public.players (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  gender text not null check (gender in ('M', 'F')),
  club text,
  license_number text unique,
  is_foreign boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index players_last_name_idx on public.players (last_name);
create index players_club_idx on public.players (club);

alter table public.players enable row level security;

create policy "players_public_read" on public.players for select using (true);
create policy "players_admin_write" on public.players for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- player_rankings : état courant (classement, moyennes) par joueur et discipline.
-- ---------------------------------------------------------------------------
create table public.player_rankings (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  discipline text not null check (discipline in ('simple', 'double', 'mixte')),
  classement smallint not null default 12 check (classement between 1 and 12),
  moyenne_montee numeric not null default 0,
  moyenne_descente numeric not null default 0,
  match_count_montee integer not null default 0,
  match_count_descente integer not null default 0,
  last_evaluation_date date,
  last_change text check (last_change in ('montee', 'descente')),
  protected_until date,
  inactivity_already_demoted boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (player_id, discipline)
);

create index player_rankings_discipline_classement_idx on public.player_rankings (discipline, classement);

alter table public.player_rankings enable row level security;

create policy "player_rankings_public_read" on public.player_rankings for select using (true);
create policy "player_rankings_admin_write" on public.player_rankings for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  discipline text not null check (discipline in ('simple', 'double', 'mixte')),
  match_date date not null,
  competition_type text not null check (competition_type in ('tournoi', 'interclub', 'championnat')),
  source text not null default 'manual' check (source in ('manual', 'import')),
  is_walkover boolean not null default false,
  side_a_player1 uuid not null references public.players (id),
  side_a_player2 uuid references public.players (id),
  side_b_player1 uuid not null references public.players (id),
  side_b_player2 uuid references public.players (id),
  winner_side text not null check (winner_side in ('A', 'B')),
  classement_a1 smallint not null check (classement_a1 between 1 and 12),
  classement_a2 smallint check (classement_a2 between 1 and 12),
  classement_b1 smallint not null check (classement_b1 between 1 and 12),
  classement_b2 smallint check (classement_b2 between 1 and 12),
  score text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index matches_discipline_date_idx on public.matches (discipline, match_date desc);
create index matches_side_a_player1_idx on public.matches (side_a_player1);
create index matches_side_a_player2_idx on public.matches (side_a_player2);
create index matches_side_b_player1_idx on public.matches (side_b_player1);
create index matches_side_b_player2_idx on public.matches (side_b_player2);

alter table public.matches enable row level security;

create policy "matches_public_read" on public.matches for select using (true);
create policy "matches_admin_write" on public.matches for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- ranking_history : snapshot pris à chaque évaluation, pour les courbes d'évolution.
-- ---------------------------------------------------------------------------
create table public.ranking_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  discipline text not null check (discipline in ('simple', 'double', 'mixte')),
  classement smallint not null check (classement between 1 and 12),
  moyenne_montee numeric not null default 0,
  moyenne_descente numeric not null default 0,
  evaluation_date date not null,
  created_at timestamptz not null default now(),
  unique (player_id, discipline, evaluation_date)
);

create index ranking_history_player_discipline_idx on public.ranking_history (player_id, discipline, evaluation_date);

alter table public.ranking_history enable row level security;

create policy "ranking_history_public_read" on public.ranking_history for select using (true);
create policy "ranking_history_admin_write" on public.ranking_history for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
