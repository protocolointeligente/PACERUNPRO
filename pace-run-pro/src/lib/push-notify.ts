/**
 * Sends a web-push notification to all subscriptions of a user.
 * Silently no-ops when VAPID vars are not configured.
 * Cleans up stale/expired endpoints automatically (HTTP 410/404).
 */
import type { PrismaClient } from "@prisma/client";

export async function sendPushToUser(
  prisma: PrismaClient,
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { endpoint: true, p256dh: true, auth: true },
  });
  if (subscriptions.length === 0) return;

  const webpush = await import("web-push");
  webpush.default.setVapidDetails(
    process.env.VAPID_SUBJECT ?? `mailto:${process.env.VAPID_EMAIL ?? "suporte@pacerunpro.com.br"}`,
    vapidPublic,
    vapidPrivate,
  );

  const payloadStr = JSON.stringify(payload);
  const stale: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.default.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payloadStr,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) stale.push(sub.endpoint);
      }
    }),
  );

  if (stale.length > 0) {
    await prisma.pushSubscription
      .deleteMany({ where: { endpoint: { in: stale } } })
      .catch(() => null);
  }
}

/**
 * Creates a DB notification and sends a push in one call.
 * Drop-in replacement for prisma.notification.create + push.
 */
export async function createNotificationAndPush(
  prisma: PrismaClient,
  data: { userId: string; title: string; body: string; link?: string | null },
): Promise<void> {
  await prisma.notification.create({ data });
  await sendPushToUser(prisma, data.userId, {
    title: data.title,
    body: data.body,
    url: data.link ?? "/",
  });
}
