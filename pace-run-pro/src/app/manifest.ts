import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PACERUNPRO",
    short_name: "PACERUNPRO",
    description:
      "Plataforma profissional para treinadores de corrida, assessorias esportivas, personal trainers e corredores.",
    start_url: "/atleta/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0A0C0F",
    theme_color: "#2563EB",
    icons: [
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
