-- Ejecutar una sola vez en el SQL editor de Supabase (Project > SQL Editor).
-- Crea la tabla de un solo registro que guarda el estado de paro y la
-- deja sembrada en "NO hay paro" con la fecha de hoy.

create table if not exists strike_status (
  id smallint primary key default 1,
  is_strike boolean not null default false,
  message text not null default '',
  updated_at timestamptz not null default now(),
  constraint strike_status_single_row check (id = 1)
);

-- RLS habilitado y sin policies: solo la service role key (usada del lado
-- del servidor en Next.js) puede leer/escribir. La anon key no tiene acceso.
alter table strike_status enable row level security;

insert into strike_status (id, is_strike, message, updated_at)
values (1, false, '', now())
on conflict (id) do nothing;
