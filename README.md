# ¿Hay Paro Hoy?

Página de una sola pantalla que responde SÍ/NO a si hay paro de transporte
público (colectivos, subte, trenes) en Buenos Aires. El estado se actualiza
a mano desde `/admin` — no hay scraping ni automatización.

## Cómo funciona

- `/` lee el estado actual desde Supabase en cada visita (sin caché) y
  muestra SÍ/NO en grande, con el contexto (gremio, servicios afectados,
  horario) cuando hay paro, y la fecha/hora de la última actualización.
- `/admin` está protegida con una contraseña única (variable de entorno
  `ADMIN_PASSWORD`, sin usuarios). Desde ahí se togglea SÍ/NO hay paro y
  se escribe el contexto en un campo de texto libre.
- Todo se guarda en una sola fila de la tabla `strike_status` en Supabase
  (se pisa en cada actualización, no hay historial).

## Correr local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear un proyecto en [Supabase](https://supabase.com) (gratis) y correr
   el contenido de [`supabase-schema.sql`](./supabase-schema.sql) en el
   SQL Editor del proyecto. Esto crea la tabla `strike_status` y la deja
   sembrada en "NO hay paro".

3. Copiar `.env.example` a `.env.local` y completar:

   ```bash
   cp .env.example .env.local
   ```

   - `ADMIN_PASSWORD`: la contraseña que vas a usar para entrar a `/admin`.
   - `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`: en el dashboard de
     Supabase, Project Settings → API.

4. Levantar el servidor:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000) y
   [http://localhost:3000/admin](http://localhost:3000/admin).

## Actualizar el estado (uso diario)

1. Entrar a `https://<tu-dominio>/admin` e ingresar la contraseña.
2. Togglear SÍ/NO hay paro.
3. Escribir el contexto (gremio, servicios afectados, si es parcial o
   total, horario) — solo se usa cuando hay paro.
4. Guardar. La página principal refleja el cambio de inmediato, no hay
   caché.

## Deployar a Vercel

1. Importar este repo en [vercel.com/new](https://vercel.com/new).
2. En las variables de entorno del proyecto en Vercel, cargar las mismas
   tres de `.env.example`: `ADMIN_PASSWORD`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`.
3. Deploy. Verificar que `supabase-schema.sql` ya se haya corrido en el
   proyecto de Supabase (paso 2 de "Correr local") antes del primer visit,
   así la home no arranca rota.

## Stack

Next.js (App Router) + TypeScript + Tailwind + Supabase. Sin LLM, sin APIs
externas pagas.
