import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.pacerunpro.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/login", priority: 0.5, changeFrequency: "yearly" },
    { path: "/cadastro", priority: 0.7, changeFrequency: "monthly" },
    { path: "/termos", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacidade", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
