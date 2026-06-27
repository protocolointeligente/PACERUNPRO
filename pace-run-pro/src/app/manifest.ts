import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PACERUNPRO",
    short_name: "PACERUNPRO",
    description:
      "Sistema operacional de performance para treinadores de corrida, assessorias esportivas e corredores.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0C0F",
    theme_color: "#0A0C0F",
    icons: [
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
        purpose: "any",
      },
      {
        src: "/icons/logo-mark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
