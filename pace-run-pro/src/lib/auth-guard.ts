import { auth } from "@/auth";
import type { Session } from "next-auth";

/** Safe wrapper — returns null instead of throwing when auth() fails. */
export async function getSession(): Promise<Session | null> {
  try {
    return await auth();
  } catch {
    return null;
  }
}
