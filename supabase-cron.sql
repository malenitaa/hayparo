-- Dispara /api/cron/check-strike cada 15 minutos desde Supabase (pg_cron +
-- pg_net). Reemplaza al schedule de GitHub Actions como disparador
-- principal: GitHub corría cada ~5 h en vez de cada 15 min (#4).
--
-- Cómo instalarlo (una sola vez, en Project > SQL Editor):
--
-- 1. Guardar el CRON_SECRET (el mismo valor que está en Vercel) en Vault.
--    Correlo aparte y no lo guardes en el repo:
--
--      select vault.create_secret('<el CRON_SECRET>', 'hayparo_cron_secret');
--
-- 2. Correr este archivo. Es seguro volver a correrlo: si el job ya
--    existía, cron.schedule con el mismo nombre lo actualiza.
--
-- Cómo ver si anda:
--
--   -- Corridas del job (¿se disparó?):
--   select status, return_message, start_time
--   from cron.job_run_details
--   where jobid = (select jobid from cron.job where jobname = 'hayparo-check-strike')
--   order by start_time desc limit 10;
--
--   -- Respuestas del endpoint (se guardan 6 h):
--   select created, status_code, left(content::text, 200) as body, error_msg
--   from net._http_response order by created desc limit 10;
--
-- Para apagarlo: select cron.unschedule('hayparo-check-strike');

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'hayparo-check-strike',
  '*/15 * * * *',
  $$
  select net.http_get(
    url := 'https://hayparo.net.ar/api/cron/check-strike',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'hayparo_cron_secret'
      )
    ),
    -- La ruta puede tardar hasta ~35 s (Google News + Gemini).
    timeout_milliseconds := 60000
  );
  $$
);
