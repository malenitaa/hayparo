# ¿Hay Paro Hoy?

Página de una sola pantalla que responde SÍ/NO a si hay paro de transporte
público (colectivos, subte, trenes) en Buenos Aires. El estado se actualiza
**solo, automáticamente, varias veces al día**, a partir de noticias. `/admin`
sigue existiendo, pero como corrección manual (por si el sistema automático
se equivoca), no como el flujo normal.

## Cómo funciona

- `/` lee el estado actual desde Supabase en cada visita (sin caché) y
  muestra SÍ/NO en grande, con el contexto (gremio, servicios afectados,
  horario) cuando hay paro, y la fecha/hora de la última actualización. Si
  se cargaron líneas de colectivo adheridas, aparece un botón ("Ver líneas
  afectadas") que las muestra en un popup, sin mover ni desordenar la
  respuesta principal.
- **Detección automática** (`/api/cron/check-strike`, disparada por Vercel
  Cron 4 veces al día — 6, 10, 14 y 18hs de Argentina):
  1. Busca titulares recientes en el RSS de búsqueda de Google News
     (agrega Clarín, La Nación, Infobae, Ámbito, etc. en un solo feed —
     ver la nota de diseño más abajo sobre por qué se eligió esta fuente
     en vez de los RSS de cada medio por separado).
  2. Filtra por palabras clave (paro, huelga, colectivo, subte, tren,
     gremio, UTA) y por antigüedad (últimas 24hs).
  3. Si no queda ningún candidato relevante, el estado se fija en **NO hay
     paro** (mejor un falso negativo ocasional que gritar paro sin
     evidencia).
  4. Si hay candidatos, se los pasa a Gemini Flash con un prompt que
     decide si hay un paro **confirmado para hoy específicamente** (no la
     semana que viene, no uno ya pasado) y devuelve un resumen corto.
  5. Actualiza la misma fila de `strike_status`, guardando también el
     titular que originó la detección (`detected_from`) y el origen
     (`updated_by = 'cron'`), para poder auditar si se equivocó.
  6. Si falla el fetch a Google News o la llamada a Gemini, **no toca el
     estado guardado** — solo loguea el error. Una falla transitoria no
     debe pisar un dato válido.
- `/admin` está protegida con una contraseña única (variable de entorno
  `ADMIN_PASSWORD`, sin usuarios). Sirve para corregir a mano si el
  automático se equivocó: togglear SÍ/NO, contexto libre y, opcionalmente,
  líneas de colectivo adheridas. Guardar ahí marca `updated_by = 'manual'`.
  **Importante**: como el cron vuelve a correr cada pocas horas, una
  corrección manual puede quedar pisada en la próxima corrida automática si
  esta vuelve a encontrar (o no encuentra) señal — no es un override
  permanente, es un parche hasta el siguiente chequeo.
- Todo se guarda en una sola fila de la tabla `strike_status` en Supabase
  (se pisa en cada actualización, no hay historial).

### Por qué Google News RSS y no el RSS de cada medio

Clarín, La Nación e Infobae tuvieron/tienen RSS propio, pero los medios
grandes argentinos vienen reforzando protección anti-bots (Cloudflare/WAF),
que puede bloquear un fetch server-to-server (como el de una función de
Vercel) aunque el feed técnicamente exista. El RSS de búsqueda de Google
News agrega varios medios en un solo feed y es menos frágil que apostar a
uno solo. Contras conocidos: no tiene SLA ni versionado (Google puede
cambiar el formato sin avisar) y los links son redirects de Google en vez
de la URL original — no es problema acá porque solo se usa el título del
titular para pasárselo a Gemini, no el artículo completo.

**Este mecanismo está marcado como "a confirmar" en los logs** (buscá
`[cron:check-strike]` en los logs de Vercel) — no se pudo probar en vivo
durante el desarrollo, así que conviene revisar la primera corrida real en
producción para confirmar que el fetch a Google News y la respuesta de
Gemini funcionan como se espera.

## Correr local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Conseguir un proyecto en [Supabase](https://supabase.com): podés crear
   uno nuevo (plan gratis) o reusar uno que ya tengas — la tabla que se
   crea es autocontenida y no toca nada más de ese proyecto. Correr el
   contenido de [`supabase-schema.sql`](./supabase-schema.sql) en el SQL
   Editor. Esto crea/actualiza la tabla `strike_status` (es seguro
   volver a correrlo, no pisa datos existentes) y la deja sembrada en "NO
   hay paro" si es la primera vez.

3. Copiar `.env.example` a `.env.local` y completar:

   ```bash
   cp .env.example .env.local
   ```

   - `ADMIN_PASSWORD`: la contraseña para entrar a `/admin`.
   - `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`: en el dashboard de
     Supabase, Project Settings → API.
   - `GEMINI_API_KEY`: de [Google AI Studio](https://aistudio.google.com/apikey)
     (podés reusar una key de otro proyecto, el free tier no la limita a
     un solo proyecto).
   - `CRON_SECRET`: un valor random largo (ej. `openssl rand -hex 32`).

4. Levantar el servidor:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000) y
   [http://localhost:3000/admin](http://localhost:3000/admin).

   Para probar el cron a mano en local:

   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/check-strike
   ```

## Corregir el estado a mano (excepcional)

1. Entrar a `https://<tu-dominio>/admin` e ingresar la contraseña.
2. Togglear SÍ/NO hay paro.
3. Escribir el contexto (gremio, servicios afectados, si es parcial o
   total, horario) — solo se usa cuando hay paro.
4. Opcional: listar las líneas de colectivo adheridas.
5. Guardar. Tené en cuenta que la próxima corrida del cron (cada pocas
   horas) puede volver a cambiar el estado según lo que encuentre.

## Deployar a Vercel

1. Importar este repo en [vercel.com/new](https://vercel.com/new).
2. En las variables de entorno del proyecto en Vercel, cargar las de
   `.env.example`: `ADMIN_PASSWORD`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `CRON_SECRET`.
3. Deploy. Vercel detecta `vercel.json` y programa el cron automáticamente
   (4 corridas diarias — cada una es, individualmente, una corrida por
   día, así que funciona en el plan Hobby/gratuito sin upgrade).
4. Verificar que `supabase-schema.sql` ya se haya corrido en el proyecto
   de Supabase antes del primer visit, así la home no arranca rota.
5. Revisar los logs de la primera corrida del cron (Vercel → tu proyecto →
   Logs, filtrar por `check-strike`) para confirmar que el fetch a Google
   News y Gemini responden bien.

## Stack

Next.js (App Router) + TypeScript + Tailwind + Supabase + Vercel Cron +
Gemini Flash (clasificación de titulares). Sin APIs externas pagas.
