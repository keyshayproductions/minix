-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── USERS ───────────────────────────────────────────────────────────────────
create type user_role as enum ('user', 'verified_creator', 'moderator', 'admin');
create type account_status as enum ('active', 'suspended', 'banned');

create table users (
  id uuid primary key default uuid_generate_v4(),
  username text unique not null,
  email text unique not null,
  password_hash text,
  avatar text,
  bio text,
  role user_role not null default 'user',
  verified_creator boolean not null default false,
  strike_count int not null default 0,
  account_status account_status not null default 'active',
  created_at timestamptz not null default now(),
  last_active timestamptz
);

-- ─── GAMES ───────────────────────────────────────────────────────────────────
create type game_visibility as enum ('public', 'unlisted', 'private');
create type game_type as enum ('single_player', 'multiplayer', 'both');
create type game_status as enum ('published', 'draft', 'shadow_review', 'removed');

create table games (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  thumbnail text,
  category text,
  tags text[],
  visibility game_visibility not null default 'public',
  game_type game_type not null default 'single_player',
  current_version text,
  total_plays int not null default 0,
  total_likes int not null default 0,
  average_rating numeric(3,2) not null default 0,
  status game_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── GAME VERSIONS ───────────────────────────────────────────────────────────
create table game_versions (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  version_number text not null,
  version_notes text,
  saved_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  game_data_snapshot jsonb not null
);

-- ─── DRAFTS ──────────────────────────────────────────────────────────────────
create table drafts (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references users(id) on delete cascade,
  game_id uuid references games(id) on delete cascade,
  draft_data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- ─── COLLABORATORS ───────────────────────────────────────────────────────────
create type permission_level as enum ('view_only', 'editor', 'manager');

create table collaborators (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  permission_level permission_level not null default 'view_only',
  unique(game_id, user_id)
);

-- ─── FOLLOWERS ───────────────────────────────────────────────────────────────
create table followers (
  id uuid primary key default uuid_generate_v4(),
  follower_id uuid not null references users(id) on delete cascade,
  following_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(follower_id, following_id)
);

-- ─── LIKES ───────────────────────────────────────────────────────────────────
create table likes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  game_id uuid not null references games(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, game_id)
);

-- ─── RATINGS ─────────────────────────────────────────────────────────────────
create table ratings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  game_id uuid not null references games(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  unique(user_id, game_id)
);

-- ─── COMMENTS ────────────────────────────────────────────────────────────────
create table comments (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  parent_comment_id uuid references comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
create table messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null references users(id) on delete cascade,
  receiver_id uuid not null references users(id) on delete cascade,
  message text not null,
  read_status boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  content text not null,
  read_status boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─── REPORTS ─────────────────────────────────────────────────────────────────
create type report_target_type as enum ('game', 'comment', 'user', 'message');
create type report_status as enum ('open', 'under_review', 'closed');

create table reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references users(id) on delete cascade,
  target_type report_target_type not null,
  target_id uuid not null,
  reason text not null,
  details text,
  status report_status not null default 'open',
  assigned_moderator uuid references users(id),
  created_at timestamptz not null default now()
);

-- ─── MODERATION ACTIONS ──────────────────────────────────────────────────────
create table moderation_actions (
  id uuid primary key default uuid_generate_v4(),
  moderator_id uuid not null references users(id),
  target_type report_target_type not null,
  target_id uuid not null,
  action text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- ─── MULTIPLAYER LOBBIES ─────────────────────────────────────────────────────
create type lobby_status as enum ('waiting', 'starting', 'in_progress', 'ended');

create table multiplayer_lobbies (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  host_id uuid not null references users(id) on delete cascade,
  status lobby_status not null default 'waiting',
  max_players int not null default 4,
  current_players int not null default 1,
  created_at timestamptz not null default now()
);

-- ─── FEATURED CREATORS ───────────────────────────────────────────────────────
create table featured_creators (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references users(id) on delete cascade,
  start_date date not null,
  end_date date not null
);

-- ─── AUTO-UPDATE updated_at ──────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger games_updated_at
  before update on games
  for each row execute function update_updated_at();

create trigger drafts_updated_at
  before update on drafts
  for each row execute function update_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table users enable row level security;
alter table games enable row level security;
alter table game_versions enable row level security;
alter table drafts enable row level security;
alter table collaborators enable row level security;
alter table followers enable row level security;
alter table likes enable row level security;
alter table ratings enable row level security;
alter table comments enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;
alter table moderation_actions enable row level security;
alter table multiplayer_lobbies enable row level security;
alter table featured_creators enable row level security;

-- Users: public profiles readable by all, editable only by owner
create policy "Public profiles are viewable" on users for select using (true);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

-- Games: public games viewable by all
create policy "Public games are viewable" on games for select using (visibility = 'public' or creator_id = auth.uid());
create policy "Creators can insert games" on games for insert with check (creator_id = auth.uid());
create policy "Creators can update own games" on games for update using (creator_id = auth.uid());
create policy "Creators can delete own games" on games for delete using (creator_id = auth.uid());

-- Drafts: only owner
create policy "Owners can manage drafts" on drafts for all using (creator_id = auth.uid());

-- Likes: authenticated users
create policy "Users can like games" on likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike games" on likes for delete using (auth.uid() = user_id);
create policy "Likes are public" on likes for select using (true);

-- Comments: readable by all, writable by authenticated
create policy "Comments are public" on comments for select using (true);
create policy "Users can comment" on comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on comments for delete using (auth.uid() = user_id);

-- Messages: sender or receiver only
create policy "Users can see own messages" on messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages" on messages for insert with check (auth.uid() = sender_id);

-- Notifications: own only
create policy "Users can see own notifications" on notifications for select using (auth.uid() = user_id);

-- Followers: public
create policy "Followers are public" on followers for select using (true);
create policy "Users can follow" on followers for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on followers for delete using (auth.uid() = follower_id);
