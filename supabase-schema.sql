-- Ejecutar en el SQL editor de Supabase (Project > SQL Editor). Es seguro
-- volver a correrlo si ya existía la tabla: usa IF NOT EXISTS / ADD COLUMN
-- IF NOT EXISTS, así que no pisa datos existentes.
--
-- Esta tabla es autocontenida: podés correr este script en cualquier
-- proyecto Supabase que ya tengas (no interfiere con otras tablas).

create table if not exists strike_status (
  id smallint primary key default 1,
  is_strike boolean not null default false,
  message text not null default '',
  affected_lines text not null default '',
  updated_at timestamptz not null default now(),
  constraint strike_status_single_row check (id = 1)
);

-- Por si la tabla ya existía de una versión anterior sin estas columnas.
alter table strike_status add column if not exists affected_lines text not null default '';

-- 'cron' = lo puso el chequeo automático de noticias, 'manual' = lo cargaste
-- vos desde /admin (por ejemplo para corregir un error del automático).
alter table strike_status add column if not exists updated_by text not null default 'manual';
alter table strike_status add column if not exists detected_from text not null default '';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'strike_status_updated_by_check'
  ) then
    alter table strike_status
      add constraint strike_status_updated_by_check check (updated_by in ('cron', 'manual'));
  end if;
end $$;

-- RLS habilitado y sin policies: solo la service role key (usada del lado
-- del servidor en Next.js) puede leer/escribir. La anon key no tiene acceso.
alter table strike_status enable row level security;

insert into strike_status (id, is_strike, message, affected_lines, updated_by, detected_from, updated_at)
values (1, false, '', '', 'manual', '', now())
on conflict (id) do nothing;
