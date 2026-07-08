import { describe, expect, it, vi } from "vitest";
import { ensureCoachRecord } from "../coach-record";

describe("ensureCoachRecord", () => {
  it("creates a coach record when a coach user has no row yet", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "coach_1", userId: "user_1" });
    const prisma = { coach: { upsert } } as unknown as Parameters<typeof ensureCoachRecord>[1];

    const result = await ensureCoachRecord("user_1", prisma);

    expect(result.id).toBe("coach_1");
    expect(upsert).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      update: {},
      create: { userId: "user_1", specialties: [] },
      select: { id: true, userId: true },
    });
  });
});
