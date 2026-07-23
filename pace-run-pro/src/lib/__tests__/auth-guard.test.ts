import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));

import { getSession } from "@/lib/auth-guard";

describe("getSession", () => {
  beforeEach(() => authMock.mockReset());

  it("returns null for an anonymous request", async () => {
    authMock.mockResolvedValue(null);
    await expect(getSession()).resolves.toBeNull();
  });

  it("returns the authenticated session unchanged", async () => {
    const session = { user: { id: "user-1", role: "coach" } };
    authMock.mockResolvedValue(session);
    await expect(getSession()).resolves.toBe(session);
  });

});
