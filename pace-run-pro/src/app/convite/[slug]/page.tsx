import { redirect } from "next/navigation";

export default async function ConvitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/cadastro?ref=${encodeURIComponent(slug)}`);
}
