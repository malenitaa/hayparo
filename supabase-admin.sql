-- Sesiones de /admin y freno a los intentos de login (#7). Correr una vez en
-- el SQL editor de Supabase (Project > SQL Editor). Es seguro volver a
-- correrlo: usa IF NOT EXISTS.
--
-- Igual que strike_status: RLS habilitado y sin policies, así que solo la
-- service role key (del lado del servidor) puede leer o escribir.

-- Una fila por sesión abierta. Se guarda el hash del token, no el token: si
-- alguien lee la tabla, no puede armar una cookie válida.
create table if not exists admin_sessions (
  token_hash text primary key,
  expires_at timestamptz not null
);
alter table admin_sessions enable row level security;

-- Un registro por intento de login, para frenar intentos repetidos desde una
-- IP. Se guarda antes de mirar la contraseña; un login exitoso borra los de
-- su IP.
create table if not exists admin_login_failures (
  id bigint generated always as identity primary key,
  ip text not null,
  attempted_at timestamptz not null default now()
);
create index if not exists admin_login_failures_ip_attempted_at
  on admin_login_failures (ip, attempted_at);
alter table admin_login_failures enable row level security;
