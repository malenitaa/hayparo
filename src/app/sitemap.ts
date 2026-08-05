import type { MetadataRoute } from "next";
import { getStrikeStatus } from "@/lib/strike-status";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const status = await getStrikeStatus();

  return [
    {
      url: "https://hayparo.net.ar",
      // El estado real se actualiza cada 15min-2hs (ver cron/check-strike);
      // usamos el updatedAt real de Supabase en vez de la fecha del build/
      // request, para que el sitemap refleje cuándo cambió el contenido
      // de verdad, no cuándo Google pasó a leerlo.
      lastModified: status.ok ? new Date(status.updatedAt) : new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
  ];
}
