import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://hayparo.net.ar",
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
