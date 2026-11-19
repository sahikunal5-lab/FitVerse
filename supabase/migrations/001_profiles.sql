
-- FitVerse Phase 3.2
-- Migration 001: User profiles

begin;


-- ==========================================
-- 1. CREATE PROFILES TABLE
-- ==========================================

create table public.profiles (

    id uuid primary key
        references auth.users(id)
        on delete cascade,

    full_name text not null default ''
        check (char_length(full_name) <= 100),

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now()

);


-- ==========================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ==========================================

alter table public.profiles
enable row level security;


-- ==========================================
-- 3. CONFIGURE TABLE PERMISSIONS
-- ==========================================

revoke all privileges
on table public.profiles
from public, anon, authenticated;

grant select
on table public.profiles
to authenticated;


-- ==========================================
-- 4. CREATE RLS POLICY
-- ==========================================

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (
    (select auth.uid()) = id
);


-- ==========================================
-- 5. CREATE AUTOMATIC PROFILE FUNCTION
-- ==========================================

create function public.handle_new_fitverse_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

    insert into public.profiles (
        id,
        full_name
    )
    values (
        new.id,
        left(
            trim(
                coalesce(
                    new.raw_user_meta_data ->> 'full_name',
                    ''
                )
            ),
            100
        )
    );

    return new;

end;
$$;


-- ==========================================
-- 6. RESTRICT FUNCTION EXECUTION
-- ==========================================

revoke execute
on function public.handle_new_fitverse_user()
from public, anon, authenticated;


-- ==========================================
-- 7. CREATE DATABASE TRIGGER
-- ==========================================

create trigger on_fitverse_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_fitverse_user();


-- ==========================================
-- 8. BACKFILL EXISTING AUTH USERS
-- ==========================================

insert into public.profiles (
    id,
    full_name
)
select
    id,
    left(
        trim(
            coalesce(
                raw_user_meta_data ->> 'full_name',
                ''
            )
        ),
        100
    )
from auth.users
on conflict (id) do nothing;


commit;
