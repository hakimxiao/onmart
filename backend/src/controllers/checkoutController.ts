import type { Request, Response, NextFunction } from "express";
import { getEnv } from "../lib/env";
import z from "zod";
import { getAuth } from "@clerk/express";
import { getLocalUser } from "../lib/users";
import { db } from "../db";
import { CheckoutSessionLine, checkoutSessions, products } from "../db/schema";
import { and, inArray, eq } from "drizzle-orm";
import { PolarCheckoutError, polarCreateCheckout } from "../lib/polar";

const env = getEnv();

const cartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export async function createCheckoutController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // only signed-in users can start checkout
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = cartSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Invalid cart", details: parsed.error.flatten() });
      return;
    }

    // polar access token is required
    if (!env.POLAR_ACCESS_TOKEN) {
      res.status(503).json({ error: "Polar access token is not configured" });
      return;
    }

    const localUser = await getLocalUser(userId);
    if (!localUser) {
      res.status(503).json({ error: "Account not synced yet" });
      return;
    }

    const ids = parsed.data.items.map((i) => i.productId);

    // load every cart product that exists, is active, and matches the 10s we asked for.
    const prodRows = await db
      .select()
      .from(products)
      .where(and(inArray(products.id, ids), eq(products.active, true)));

    if (prodRows.length !== ids.length) {
      res.status(400).json({ error: "Some products in the cart are invalid" });
      return;
    }

    // calculate
    const byId = new Map(prodRows.map((p) => [p.id, p]));
    let totalCents = 0;
    const lines: CheckoutSessionLine[] = [];
    const currency = prodRows[0]?.currency?.toLowerCase() ?? "usd";

    for (const line of parsed.data.items) {
      const p = byId.get(line.productId)!;
      if (p.currency.toLowerCase() !== currency) {
        res.status(400).json({ error: "Cart items must use the same currency" });
        return;
      }

      totalCents += p.priceCents * line.quantity;
      lines.push({
        productId: p.id,
        quantity: line.quantity,
        unitPriceCents: p.priceCents,
      });
    }

    if (totalCents < 10) {
      res.status(400).json({
        error: "Total below polar minimum of $0.10",
      });
      return;
    }

    const [session] = await db
      .insert(checkoutSessions)
      .values({
        userId: localUser.id,
        lines,
        totalCents,
        currency,
      })
      .returning();

    const frontendUrl = env.FRONTEND_URL.replace(/\/+$/, "");
    const successUrl = `${frontendUrl}/checkout/return?checkout_id={CHECKOUT_ID}`;
    const returnUrl = `${frontendUrl}/cart`;

    let checkout;
    try {
      checkout = await polarCreateCheckout(env, {
        products: [env.POLAR_CHECKOUT_PRODUCT_ID],
        prices: {
          [env.POLAR_CHECKOUT_PRODUCT_ID]: [
            {
              amount_type: "fixed",
              price_currency: currency,
              price_amount: totalCents,
            },
          ],
        },

        success_url: successUrl,
        return_url: returnUrl,
        external_customer_id: userId,
        metadata: {
          checkout_session_id: session.id,
        },
      });
    } catch (error) {
      if (error instanceof PolarCheckoutError) {
        console.error("Polar checkout error", {
          status: error.status,
          response: error.responseText,
        });

        res.status(502).json({
          error: "Payment provider rejected checkout configuration",
          ...(env.NODE_ENV === "development" && {
            details: error.responseText,
          }),
        });
        return;
      }

      throw error;
    }

    await db
      .update(checkoutSessions)
      .set({ polarCheckoutId: checkout.id })
      .where(eq(checkoutSessions.id, session.id));

    res.json({ checkoutUrl: checkout.url });
  } catch (error) {
    next(error);
  }
}
