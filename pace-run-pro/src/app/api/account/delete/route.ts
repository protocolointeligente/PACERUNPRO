/**
 * POST /api/account/delete
 * 
 * Request deletion for the current user's account.
 *
 * This route is intentionally disabled until the database has a real soft-delete
 * schema. The previous implementation promised a 30-day recovery window while
 * deleting the user row with cascade.
 * Requires authentication
 * 
 * Response:
 * {
 *   "error": "Account deletion temporarily disabled",
 *   "message": "..."
 * }
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST() {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Account deletion temporarily disabled",
        message:
          "Soft delete is not implemented in the current database schema. This endpoint is disabled to prevent irreversible data loss.",
        userId: session.user.id,
      },
      { status: 501 }
    );
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
