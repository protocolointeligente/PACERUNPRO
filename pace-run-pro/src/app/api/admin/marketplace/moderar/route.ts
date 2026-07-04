import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

// GET — list all products with listingStatus
export async function GET() {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const products = await prisma.marketplaceProduct.findMany({
    orderBy: [{ listingStatus: "asc" }, { createdAt: "desc" }],
    take: 300,
    select: {
      id: true,
      title: true,
      type: true,
      priceCents: true,
      published: true,
      featured: true,
      listingStatus: true,
      createdAt: true,
      purchases: true,
      coach: { select: { user: { select: { name: true } } } },
      store: { select: { name: true } },
    },
  });

  return NextResponse.json({ products });
}

// PATCH — change listing status (approve, suspend, reset to draft), set featured
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await req.json() as {
    id?: string;
    listingStatus?: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "SUSPENDED";
    featured?: boolean;
  };
  const { id, listingStatus, featured } = body;
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const data: Record<string, unknown> = {};

  if (listingStatus !== undefined) {
    data.listingStatus = listingStatus;
    // Keep published in sync with listingStatus
    data.published = listingStatus === "APPROVED";
  }

  if (typeof featured === "boolean") data.featured = featured;

  const updated = await prisma.marketplaceProduct.update({ where: { id }, data });

  // Write audit trail
  if (listingStatus !== undefined) {
    await writeAuditLog({
      userId: session?.user?.id,
      action: `PRODUCT_${listingStatus}`,
      entity: "MarketplaceProduct",
      entityId: id,
      meta: { listingStatus, featured },
    });
  }

  return NextResponse.json({
    product: {
      id: updated.id,
      published: updated.published,
      listingStatus: updated.listingStatus,
      featured: updated.featured,
    },
  });
}
