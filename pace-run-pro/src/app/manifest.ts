import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pace Run Pro",
    short_name: "Pace Run Pro",
    description:
      "Plataforma profissional para treinadores de corrida, assessorias esportivas, personal trainers e corredores.",
    start_url: "/",
    display: "standalone",
    background_color: "#07030f",
    theme_color: "#07030f",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
