-- Run in Supabase SQL Editor. All authenticated accounts share one company workspace.
create table public.containers (
 id uuid primary key default gen_random_uuid(), container_number text not null unique,
 vessel text not null default '', bl_number text not null default '',
 etd date, eta date, actual_arrival date,
 released boolean not null default false, documents_emq boolean not null default false,
 unloading_planned boolean not null default false, archived boolean not null default false,
 notes text not null default '', created_at timestamptz not null default now()
);
create table public.container_suppliers (
 id uuid primary key default gen_random_uuid(), container_id uuid not null references public.containers(id) on delete cascade,
 supplier_name text not null, deposit_paid boolean not null default false,
 fully_paid boolean not null default false, unique(container_id,supplier_name)
);
create table public.article_lines (
 id uuid primary key default gen_random_uuid(), container_supplier_id uuid not null references public.container_suppliers(id) on delete cascade,
 order_number text not null default '', article_number text not null,
 description text not null default '', quantity numeric(16,2) not null check(quantity>=0)
);
-- Explicitly allow access only to approved users added to this table by an administrator.
create table public.app_users (user_id uuid primary key references auth.users(id) on delete cascade);
create or replace function public.is_app_user() returns boolean language sql stable security definer set search_path = public as $$
 select exists(select 1 from public.app_users where user_id=auth.uid())
$$;
revoke all on function public.is_app_user() from public;
grant execute on function public.is_app_user() to authenticated;
alter table public.containers enable row level security;
alter table public.container_suppliers enable row level security;
alter table public.article_lines enable row level security;
alter table public.app_users enable row level security;
create policy "approved users containers" on public.containers for all to authenticated using (public.is_app_user()) with check (public.is_app_user());
create policy "approved users suppliers" on public.container_suppliers for all to authenticated using (public.is_app_user()) with check (public.is_app_user());
create policy "approved users articles" on public.article_lines for all to authenticated using (public.is_app_user()) with check (public.is_app_user());
-- No client policies on app_users: admins approve users via SQL/service role only.
