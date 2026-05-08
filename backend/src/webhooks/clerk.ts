import type { Request, Response } from "express";
import { getEnv } from "../lib/env";
import { parseRole } from "../lib/roles";
import { db } from "../db";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export async function clerkWebHookHandler(req: Request, res: Response) {
  const { CLERK_WEBHOOK_SECRET } = getEnv();

  try {
    // webhook verification needs a shared secret; without it we cannot trust incoming POSTs.
    if (!CLERK_WEBHOOK_SECRET) {
      res.status(503).send("Webhook secret not configured");
      return;
    }

    // Clerk's verifier expects a web Request with the raw body; Express may give Buffer or string
    const payload =
      req.body instanceof Buffer
        ? req.body.toString("utf-8")
        : String(req.body);

    const request = new Request("http://internal/webhooks/clerk", {
      method: "POST",
      headers: new Headers(req.headers as HeadersInit),
      body: payload,
    });

    // throws if signature is wrong or body was tempered with: only then we trust evt
    const evt = await verifyWebhook(request, {
      signingSecret: CLERK_WEBHOOK_SECRET,
    });
    if (evt.type === "user.created" || evt.type === "user.updated") {
      const u = evt.data;

      const email =
        u.email_addresses?.find((e) => e.id === u.primary_email_address_id)
          ?.email_address ?? u.email_addresses?.[0]?.email_address;

      const displayName =
        [u.first_name, u.last_name].filter(Boolean).join(" ") ||
        u.username ||
        null;

      const role = parseRole(u.public_metadata?.role);

      await db
        .insert(users)
        .values({
          clerkUserId: u.id,
          email,
          displayName,
          role,
        })
        .onConflictDoUpdate({
          target: users.clerkUserId,
          set: { email, displayName, role, updatedAt: new Date() },
        });
    }

    if (evt.type === "user.deleted") {
      const id = evt.data.id;
      if (id) {
        await db.delete(users).where(eq(users.clerkUserId, id));
      }
    }

    res.json({ ok: true });
  } catch (error) {
    // Bad signature, malformed payload, or DB error - do not leak details to client
    console.error("Clerk webhook ERROR:", error);
    res.status(400).json({ error: "Invalid webhook event" });
  }
}
