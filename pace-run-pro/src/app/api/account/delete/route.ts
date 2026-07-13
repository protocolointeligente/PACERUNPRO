/**
 * POST /api/account/delete
 * 
 * Soft delete current user's account.
 * Requires authentication
 * 
 * Body:
 * {
 *   "reason": "user_requested" | "other",
 *   "message": "optional deletion reason message"
 * }
 *
 * Response:
 * {
 *   "userId": "cuid",
 *   "deletedAt": "2026-07-13T...",
 *   "graceUntil": "2026-08-12T...",
 *   "reason": "user_requested"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { softDeleteUser } from "@/lib/deletion-service";

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { reason = "user_requested" } = body as { reason?: string };

    const validReasons = [
      "user_requested",
      "admin_abuse",
      "inactivity",
      "gdpr",
      "data_breach",
      "other",
    ] as const;

    if (!validReasons.includes(reason as (typeof validReasons)[number])) {
      return NextResponse.json(
        {
          error: "Invalid deletion reason",
          validReasons,
        },
        { status: 400 }
      );
    }

    const result = await softDeleteUser(session.user.id, {
      reason: reason as (typeof validReasons)[number],
      deletedBy: undefined,
    });

    const graceUntil = new Date(result.deletedAt);
    graceUntil.setDate(graceUntil.getDate() + 30);

    return NextResponse.json({
      success: true,
      userId: result.userId,
      deletedAt: result.deletedAt,
      graceUntil,
      graceRemaining: {
        days: 30,
        message: "Your account can be restored within 30 days",
      },
      reason: result.reason,
    });
  } catch (error) {
    console.error("Error deleting user account:", error);

    return NextResponse.json(
      {
        error: "Failed to delete account",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
