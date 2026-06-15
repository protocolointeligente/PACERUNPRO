import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.pacerunpro.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/treinador",
        "/aluno",
        "/painel",
        "/onboarding",
        "/checkout",
        "/assinar",
        "/anamnese",
        "/recuperar-senha",
        "/redefinir-senha",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
