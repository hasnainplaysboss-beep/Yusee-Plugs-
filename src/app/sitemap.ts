import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://yusee-plugs.co.uk";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: `${baseUrl}/delivery`,
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: new Date(),
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      priority: 0.7,
    },
  ];
}
