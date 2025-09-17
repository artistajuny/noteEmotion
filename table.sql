
begin;

-- ---------- EXTENSIONS ----------
create extension if not exists pgcrypto; -- gen_random_uuid()

-- ---------- ENUMS ----------
create type emotion_type as enum ('happy','calm','grateful','angry','sad','anxious','stressed','tired','neutral');
create type routine_status as enum ('active','hidden','archived');
create type order_status as enum ('pending','paid','canceled','refunded');
create type currency_code as enum ('KRW','USD','JPY','EUR');
create type challenge_status as enum ('draft','active','paused','ended');
create type org_role as enum ('owner','admin','member','viewer');

-- ---------- COMMON ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ========== USERS ==========
create table public.app_user (
  id                       uuid primary key references auth.users(id) on delete cascade,
  email                    text,
  display_name             text not null default '.',
  phone_number             text,
  provider                 text,
  avatar_url               text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  last_seen_at             timestamptz,
  phone_verified_at        timestamptz,
  -- onboarding/consent
  consent_required_terms   boolean not null default false,
  consent_privacy          boolean not null default false,
  consent_marketing        boolean not null default false,
  terms_version            text,
  privacy_version          text,
  onboarding_completed_at  timestamptz
);
create unique index if not exists ux_app_user_email_partial on public.app_user (lower(email)) where email is not null;
create unique index if not exists ux_app_user_phone_partial on public.app_user (phone_number) where phone_number is not null;
create trigger trg_app_user_touch before update on public.app_user for each row execute function public.touch_updated_at();

alter table public.app_user enable row level security;
drop policy if exists app_user_select_self on public.app_user;
drop policy if exists app_user_update_self on public.app_user;
create policy app_user_select_self on public.app_user for select to authenticated using (auth.uid() = id);
create policy app_user_update_self on public.app_user for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 최초/재로그인 터치
create or replace function public.app_user_touch_or_create()
returns void language plpgsql security definer set search_path=public as $$
begin
  insert into public.app_user (id, last_seen_at) values (auth.uid(), now())
  on conflict (id) do update set last_seen_at = now();
end $$;

-- ========== ONBOARDING ==========
create table public.onboarding_response (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.app_user(id) on delete cascade,
  answers     jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_onboarding_user on public.onboarding_response(user_id);
alter table public.onboarding_response enable row level security;
drop policy if exists onboarding_owner_all on public.onboarding_response;
create policy onboarding_owner_all on public.onboarding_response for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table public.onboarding_response alter column user_id set default auth.uid();

-- ========== PHONE OTP ==========
create table public.phone_otp (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.app_user(id) on delete cascade,
  phone        text not null,
  code         text not null,
  expires_at   timestamptz not null,
  consumed_at  timestamptz,
  created_at   timestamptz not null default now(),
  constraint chk_phone_otp_code_len check (length(code) between 4 and 8)
);
create index if not exists idx_phone_otp_user_time on public.phone_otp(user_id, created_at desc);
alter table public.phone_otp enable row level security;
drop policy if exists phone_otp_owner_all on public.phone_otp;
create policy phone_otp_owner_all on public.phone_otp for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.verify_phone_otp(p_code text)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_ok boolean;
begin
  update public.phone_otp
     set consumed_at = now()
   where user_id = auth.uid()
     and code = p_code
     and consumed_at is null
     and expires_at > now()
  returning true into v_ok;

  if v_ok then
    update public.app_user set phone_verified_at = now() where id = auth.uid();
    return true;
  end if;
  return false;
end $$;

-- ========== TRUSTED DEVICES ==========
create table public.user_device (
  device_id       text primary key,
  user_id         uuid not null references public.app_user(id) on delete cascade,
  trusted         boolean not null default false,
  model           text,
  os_version      text,
  push_token      text,
  created_at      timestamptz not null default now(),
  last_active_at  timestamptz
);
alter table public.user_device enable row level security;
drop policy if exists user_device_owner_all on public.user_device;
create policy user_device_owner_all on public.user_device for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table public.user_device alter column user_id set default auth.uid();

-- ========== USER SETTINGS ==========
create table public.user_settings (
  user_id           uuid primary key references public.app_user(id) on delete cascade,
  privacy_mode      boolean not null default false,
  tts_voice         text,
  briefing_time     time,
  locale            text default 'ko-KR',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_user_settings_touch before update on public.user_settings for each row execute function public.touch_updated_at();
alter table public.user_settings enable row level security;
drop policy if exists user_settings_owner_all on public.user_settings;
create policy user_settings_owner_all on public.user_settings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ========== EMOTION LOG ==========
create table public.emotion_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.app_user(id) on delete cascade,
  emotion    emotion_type not null,
  intensity  smallint not null check (intensity between 1 and 5),
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists idx_emotion_user_time on public.emotion_log(user_id, created_at desc);
alter table public.emotion_log enable row level security;
drop policy if exists emotion_log_owner_all on public.emotion_log;
create policy emotion_log_owner_all on public.emotion_log for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table public.emotion_log alter column user_id set default auth.uid();

-- ========== ROUTINE MASTER ==========
create table public.routine (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  title         text not null,
  duration_sec  int not null default 60,
  is_premium    boolean not null default false,
  status        routine_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_routine_touch before update on public.routine for each row execute function public.touch_updated_at();

create table public.routine_step (
  id           uuid primary key default gen_random_uuid(),
  routine_id   uuid not null references public.routine(id) on delete cascade,
  step_order   int  not null,
  title        text not null,
  description  text,
  duration_sec int,
  unique (routine_id, step_order)
);

alter table public.routine enable row level security;
alter table public.routine_step enable row level security;
drop policy if exists routine_read_all on public.routine;
drop policy if exists routine_step_read_all on public.routine_step;
create policy routine_read_all on public.routine for select using (true);
create policy routine_step_read_all on public.routine_step for select using (true);

-- ========== FAVORITES ==========
create table public.routine_bookmark (
  user_id     uuid not null references public.app_user(id) on delete cascade,
  routine_id  uuid not null references public.routine(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, routine_id)
);
alter table public.routine_bookmark enable row level security;
drop policy if exists routine_bookmark_owner_all on public.routine_bookmark;
create policy routine_bookmark_owner_all on public.routine_bookmark for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ========== ROUTINE RUN ==========
create table public.routine_run (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.app_user(id) on delete cascade,
  routine_id        uuid not null references public.routine(id),
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  emotion_before    emotion_type,
  before_intensity  smallint check (before_intensity between 1 and 5),
  emotion_after     emotion_type,
  after_intensity   smallint check (after_intensity between 1 and 5),
  xp_awarded        int not null default 0,
  shared_card       boolean not null default false
);
create index if not exists idx_run_user_time on public.routine_run(user_id, started_at desc);
alter table public.routine_run enable row level security;
drop policy if exists routine_run_owner_all on public.routine_run;
create policy routine_run_owner_all on public.routine_run for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table public.routine_run alter column user_id set default auth.uid();

-- 집계 트리거
create or replace function public.bump_daily_metrics_from_run(p_run_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare r record; v_date date; v_minutes int;
begin
  select user_id, started_at, completed_at into r
  from public.routine_run where id = p_run_id and user_id = auth.uid();
  if not found or r.completed_at is null then return; end if;

  v_date := (r.completed_at at time zone 'UTC')::date;
  v_minutes := greatest(1, extract(epoch from (r.completed_at - r.started_at))/60)::int;

  insert into public.daily_metrics(metric_date, user_id, routines_completed, minutes_spent)
  values (v_date, r.user_id, 1, v_minutes)
  on conflict (metric_date, user_id)
  do update set
    routines_completed = daily_metrics.routines_completed + 1,
    minutes_spent = daily_metrics.minutes_spent + excluded.minutes_spent;
end $$;

create or replace function public._after_run_complete()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.completed_at is not null and old.completed_at is distinct from new.completed_at then
    perform public.bump_daily_metrics_from_run(new.id);
  end if;
  return new;
end $$;

drop trigger if exists trg_run_complete on public.routine_run;
create trigger trg_run_complete
after update of completed_at on public.routine_run
for each row execute function public._after_run_complete();

-- ========== SHARE CARD ==========
create table public.share_card (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.app_user(id) on delete cascade,
  routine_run_id  uuid not null references public.routine_run(id) on delete cascade,
  storage_path    text not null,
  theme           text,
  is_public       boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists idx_card_user_time on public.share_card(user_id, created_at desc);
alter table public.share_card enable row level security;
drop policy if exists share_card_owner_all on public.share_card;
drop policy if exists share_card_public_read on public.share_card;
create policy share_card_owner_all  on public.share_card for all    to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy share_card_public_read on public.share_card for select using (is_public = true);
alter table public.share_card alter column user_id set default auth.uid();

-- ========== MEDIA (공용 에셋 메타) ==========
create table public.media_asset (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.app_user(id) on delete set null,
  storage_path  text not null,
  mime_type     text,
  width         int,
  height        int,
  created_at    timestamptz not null default now()
);
alter table public.media_asset enable row level security;
drop policy if exists media_read_public on public.media_asset;
drop policy if exists media_write_owner on public.media_asset;
create policy media_read_public on public.media_asset for select using (true);
create policy media_write_owner on public.media_asset for all to authenticated using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

-- ========== MARKETPLACE: CREATOR ==========
create table public.creator_profile (
  user_id         uuid primary key references public.app_user(id) on delete cascade,
  display_name    text not null,
  bio             text,
  avatar_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_creator_touch before update on public.creator_profile for each row execute function public.touch_updated_at();
alter table public.creator_profile enable row level security;
drop policy if exists creator_owner_all on public.creator_profile;
drop policy if exists creator_public_read on public.creator_profile;
create policy creator_owner_all  on public.creator_profile for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy creator_public_read on public.creator_profile for select using (true);

-- ========== MARKETPLACE: PACK ==========
create table public.routine_pack (
  id              uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references public.creator_profile(user_id) on delete cascade,
  code            text unique not null,
  title           text not null,
  description     text,
  cover_media_id  uuid references public.media_asset(id) on delete set null,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_pack_touch before update on public.routine_pack for each row execute function public.touch_updated_at();

create table public.routine_pack_item (
  pack_id     uuid not null references public.routine_pack(id) on delete cascade,
  routine_id  uuid not null references public.routine(id) on delete cascade,
  sort_order  int not null,
  primary key (pack_id, routine_id)
);

alter table public.routine_pack enable row level security;
alter table public.routine_pack_item enable row level security;
drop policy if exists pack_public_read on public.routine_pack;
drop policy if exists pack_item_public_read on public.routine_pack_item;
drop policy if exists pack_owner_all on public.routine_pack;
drop policy if exists pack_item_owner_all on public.routine_pack_item;
create policy pack_public_read on public.routine_pack for select using (is_published = true);
create policy pack_item_public_read on public.routine_pack_item for select using (exists (select 1 from public.routine_pack p where p.id = pack_id and p.is_published = true));
create policy pack_owner_all on public.routine_pack for all to authenticated using (auth.uid() = creator_user_id) with check (auth.uid() = creator_user_id);
create policy pack_item_owner_all on public.routine_pack_item for all to authenticated using (exists (select 1 from public.routine_pack p where p.id = pack_id and p.creator_user_id = auth.uid())) with check (exists (select 1 from public.routine_pack p where p.id = pack_id and p.creator_user_id = auth.uid()));

-- 가격
create table public.routine_pack_price (
  id           uuid primary key default gen_random_uuid(),
  pack_id      uuid not null references public.routine_pack(id) on delete cascade,
  currency     currency_code not null default 'KRW',
  amount       int not null check (amount >= 0),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
alter table public.routine_pack_price enable row level security;
drop policy if exists price_public_read on public.routine_pack_price;
drop policy if exists price_owner_all on public.routine_pack_price;
create policy price_public_read on public.routine_pack_price for select using (true);
create policy price_owner_all  on public.routine_pack_price for all to authenticated using (exists (select 1 from public.routine_pack p where p.id = pack_id and p.creator_user_id = auth.uid())) with check (exists (select 1 from public.routine_pack p where p.id = pack_id and p.creator_user_id = auth.uid()));

-- 구매
create table public."order" (
  id            uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references public.app_user(id) on delete cascade,
  status        order_status not null default 'pending',
  currency      currency_code not null default 'KRW',
  amount        int not null default 0,
  receipt_meta  jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_order_touch before update on public."order" for each row execute function public.touch_updated_at();

create table public.order_item (
  order_id   uuid not null references public."order"(id) on delete cascade,
  pack_id    uuid not null references public.routine_pack(id) on delete restrict,
  unit_price int  not null,
  qty        int  not null default 1 check (qty > 0),
  primary key (order_id, pack_id)
);

-- 소유권
create table public.pack_ownership (
  user_id     uuid not null references public.app_user(id) on delete cascade,
  pack_id     uuid not null references public.routine_pack(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  primary key (user_id, pack_id)
);

alter table public."order" enable row level security;
alter table public.order_item enable row level security;
alter table public.pack_ownership enable row level security;
drop policy if exists order_owner_all on public."order";
drop policy if exists order_item_owner_read on public.order_item;
drop policy if exists ownership_owner_read on public.pack_ownership;
create policy order_owner_all       on public."order"          for all    to authenticated using (auth.uid() = buyer_user_id) with check (auth.uid() = buyer_user_id);
create policy order_item_owner_read on public.order_item       for select to authenticated using (exists (select 1 from public."order" o where o.id = order_id and o.buyer_user_id = auth.uid()));
create policy ownership_owner_read  on public.pack_ownership   for select to authenticated using (auth.uid() = user_id);

-- ========== PERSONAL CHALLENGE ==========
create table public.challenge (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.app_user(id) on delete cascade,
  title         text not null,
  description   text,
  duration_days int  not null check (duration_days between 1 and 365),
  status        challenge_status not null default 'draft',
  start_date    date,
  end_date      date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_challenge_touch before update on public.challenge for each row execute function public.touch_updated_at();

create table public.challenge_entry (
  challenge_id uuid not null references public.challenge(id) on delete cascade,
  user_id      uuid not null references public.app_user(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  progress     jsonb not null default '{}'::jsonb,
  primary key (challenge_id, user_id)
);

alter table public.challenge enable row level security;
alter table public.challenge_entry enable row level security;
drop policy if exists challenge_owner_all on public.challenge;
drop policy if exists challenge_entry_member on public.challenge_entry;
drop policy if exists challenge_public_read on public.challenge;
create policy challenge_owner_all  on public.challenge       for all    to authenticated using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy challenge_entry_member on public.challenge_entry for all  to authenticated using (auth.uid() = user_id)      with check (auth.uid() = user_id);
create policy challenge_public_read  on public.challenge       for select using (status in ('active','ended'));

-- ========== B2B ORG ==========
create table public.org (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text,
  created_at  timestamptz not null default now()
);

create table public.org_member (
  org_id     uuid not null references public.org(id) on delete cascade,
  user_id    uuid not null references public.app_user(id) on delete cascade,
  role       org_role not null default 'member',
  joined_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table public.org_challenge (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.org(id) on delete cascade,
  title        text not null,
  description  text,
  status       challenge_status not null default 'draft',
  start_date   date,
  end_date     date,
  created_at   timestamptz not null default now()
);

create table public.org_challenge_member (
  org_challenge_id uuid not null references public.org_challenge(id) on delete cascade,
  user_id          uuid not null references public.app_user(id) on delete cascade,
  joined_at        timestamptz not null default now(),
  progress         jsonb not null default '{}'::jsonb,
  primary key (org_challenge_id, user_id)
);

alter table public.org enable row level security;
alter table public.org_member enable row level security;
alter table public.org_challenge enable row level security;
alter table public.org_challenge_member enable row level security;

-- ORG RBAC helpers
create or replace function public.is_org_member(_org uuid)
returns boolean language sql stable as $$
  select exists(select 1 from public.org_member where org_id=_org and user_id=auth.uid());
$$;

create or replace function public.is_org_role_at_least(_org uuid, _min text)
returns boolean language sql stable as $$
  with me as (
    select case role when 'owner' then 3 when 'admin' then 2 when 'member' then 1 else 0 end lvl
    from public.org_member where org_id=_org and user_id=auth.uid()
  )
  select coalesce((select lvl from me),0) >= (case _min when 'owner' then 3 when 'admin' then 2 else 1 end);
$$;

-- org policies
drop policy if exists org_member_read on public.org;
create policy org_member_read on public.org for select to authenticated using (is_org_member(id));

drop policy if exists org_member_rw on public.org_member;
create policy org_member_rw  on public.org_member for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists org_chal_read on public.org_challenge;
create policy org_chal_read  on public.org_challenge for select to authenticated using (is_org_member(org_id));

drop policy if exists org_chal_member_rw on public.org_challenge_member;
create policy org_chal_member_rw on public.org_challenge_member for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- admin+ write
create policy org_admin_rw
on public.org for all to authenticated
using (is_org_role_at_least(id,'admin')) with check (is_org_role_at_least(id,'admin'));

create policy org_chal_admin_rw
on public.org_challenge for all to authenticated
using (is_org_role_at_least(org_id,'admin')) with check (is_org_role_at_least(org_id,'admin'));

-- ========== SESSION / EVENT ==========
create table public.app_session (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.app_user(id) on delete set null,
  device      text,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz
);
create index if not exists idx_session_user_time on public.app_session(user_id, started_at desc);

alter table public.app_session enable row level security;
drop policy if exists app_session_owner_all on public.app_session;
create policy app_session_owner_all on public.app_session for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.app_event (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.app_user(id) on delete set null,
  session_id   uuid references public.app_session(id) on delete set null,
  name         text not null,
  occurred_at  timestamptz not null default now(),
  props        jsonb not null default '{}'::jsonb
);
create index if not exists idx_event_user_time on public.app_event(user_id, occurred_at desc);
create index if not exists idx_event_name_time on public.app_event(name, occurred_at desc);
create index if not exists idx_event_props_gin on public.app_event using gin (props);

alter table public.app_event enable row level security;
drop policy if exists app_event_owner_select on public.app_event;
drop policy if exists app_event_owner_insert on public.app_event;
drop policy if exists app_event_owner_update on public.app_event;
create policy app_event_owner_select on public.app_event for select to authenticated using (auth.uid() = user_id or user_id is null);
create policy app_event_owner_insert on public.app_event for insert to authenticated with check (auth.uid() = user_id);
create policy app_event_owner_update on public.app_event for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.track_event(p_name text, p_props jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
  insert into public.app_event(user_id, name, props) values (auth.uid(), p_name, coalesce(p_props,'{}'::jsonb));
end $$;

-- ========== DAILY METRICS ==========
create table public.daily_metrics (
  metric_date        date not null,
  user_id            uuid not null references public.app_user(id) on delete cascade,
  routines_completed int  not null default 0,
  minutes_spent      int  not null default 0,
  cards_shared       int  not null default 0,
  primary key (metric_date, user_id)
);
alter table public.daily_metrics enable row level security;
drop policy if exists daily_metrics_owner_select on public.daily_metrics;
create policy daily_metrics_owner_select on public.daily_metrics for select to authenticated using (auth.uid() = user_id);
alter table public.daily_metrics alter column user_id set default auth.uid();

commit;

-- ========= STORAGE POLICIES (cards/media) =========
-- NOTE: storage is separate schema; do outside transaction for clarity.

-- cards/{user_id}/... only owner can read/write/update
drop policy if exists "cards_read_own"  on storage.objects;
drop policy if exists "cards_write_own" on storage.objects;
drop policy if exists "cards_update_own" on storage.objects;

create policy "cards_read_own"
on storage.objects for select to authenticated
using (bucket_id='cards' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "cards_write_own"
on storage.objects for insert to authenticated
with check (bucket_id='cards' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "cards_update_own"
on storage.objects for update to authenticated
using (bucket_id='cards' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id='cards' and (storage.foldername(name))[1] = auth.uid()::text);

-- media: read-all (optional), write/update only owner folder
drop policy if exists "media_read_all"     on storage.objects;
drop policy if exists "media_write_owner"  on storage.objects;
drop policy if exists "media_update_owner" on storage.objects;

create policy "media_read_all"
on storage.objects for select
using (bucket_id='media');

create policy "media_write_owner"
on storage.objects for insert to authenticated
with check (bucket_id='media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media_update_owner"
on storage.objects for update to authenticated
using (bucket_id='media' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id='media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ========= FUNCTION EXECUTION PERMISSIONS (tighten) =========
revoke all on function public.app_user_touch_or_create()            from public;
revoke all on function public.verify_phone_otp(text)                from public;
revoke all on function public.track_event(text, jsonb)              from public;
revoke all on function public.bump_daily_metrics_from_run(uuid)     from public;
revoke all on function public._after_run_complete()                 from public;
revoke all on function public.is_org_member(uuid)                   from public;
revoke all on function public.is_org_role_at_least(uuid,text)      from public;

grant execute on function public.app_user_touch_or_create()         to authenticated;
grant execute on function public.verify_phone_otp(text)             to authenticated;
grant execute on function public.track_event(text, jsonb)           to authenticated;
grant execute on function public.bump_daily_metrics_from_run(uuid)  to authenticated;
grant execute on function public._after_run_complete()              to authenticated;
grant execute on function public.is_org_member(uuid)                to authenticated;
grant execute on function public.is_org_role_at_least(uuid,text)    to authenticated;
