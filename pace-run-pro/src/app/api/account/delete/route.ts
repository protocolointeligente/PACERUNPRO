/**
 * DELETE /api/account/delete
 * 
 * Soft delete current user's account
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
 *   "deletedAt": "2026-07-08T...",
 *   "graceUntil": "2026-08-07T...",
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

    const body = await req.json();
    const { reason = "user_requested", message } = body;

    // Validate reason
    const validReasons = [
      "user_requested",
      "admin_abuse",
      "inactivity",
      "gdpr",
      "data_breach",
      "other",
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        {
          error: "Invalid deletion reason",
          validReasons,
        },
        { status: 400 }
      );
    }

    // Soft delete user
    const result = await softDeleteUser(session.user.id, {
      reason,
      deletedBy: undefined, // User is deleting themselves, not an admin
    });

    return NextResponse.json({
      success: true,
      userId: result.userId,
      deletedAt: result.deletedAt,
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
