import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    console.error("[Stripe Webhook] Signatur ungültig:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organizationId;
        const plan = session.metadata?.plan as "BASIC" | "PROFESSIONAL" | undefined;

        if (orgId && plan && session.subscription) {
          await prisma.organization.update({
            where: { id: orgId },
            data: {
              stripeSubscriptionId: session.subscription as string,
              subscriptionPlan: plan,
              subscriptionStatus: "ACTIVE",
            },
          });
          console.log(`[Stripe] Org ${orgId} auf ${plan} hochgestuft`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        });
        if (org) {
          const statusMap: Record<string, string> = {
            active: "ACTIVE",
            trialing: "TRIALING",
            canceled: "CANCELED",
            past_due: "PAST_DUE",
            unpaid: "UNPAID",
          };
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              subscriptionStatus: (statusMap[subscription.status] || "ACTIVE") as
                | "ACTIVE"
                | "TRIALING"
                | "CANCELED"
                | "PAST_DUE"
                | "UNPAID",
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              subscriptionPlan: "TRIAL",
              subscriptionStatus: "CANCELED",
              stripeSubscriptionId: null,
            },
          });
          console.log(`[Stripe] Org ${org.id} Abo gekündigt`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: invoice.customer as string },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { subscriptionStatus: "PAST_DUE" },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("[Stripe Webhook] Verarbeitungsfehler:", err);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
