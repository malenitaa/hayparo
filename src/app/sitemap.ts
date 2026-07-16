import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://hayparo.vercel.app",
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
