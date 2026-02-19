import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../init";
import { getStripeClient, getStripePriceId, PLAN_LIMITS } from "@/lib/stripe";

export const billingRouter = router({
  // Aktuelle Abo-Informationen abrufen
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const org = await ctx.prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!org) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Organisation nicht gefunden." });
    }

    const now = new Date();
    const trialDaysLeft = org.trialEndsAt
      ? Math.max(0, Math.ceil((org.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    const isTrialExpired =
      org.subscriptionPlan === "TRIAL" && org.trialEndsAt != null && org.trialEndsAt < now;

    return { ...org, trialDaysLeft, isTrialExpired };
  }),

  // Nutzungsstatistiken abrufen
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const org = await ctx.prisma.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
    });

    const patientCount = await ctx.prisma.patient.count({
      where: { organizationId: ctx.organizationId, isActive: true },
    });

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const plansThisMonth = await ctx.prisma.mealPlan.count({
      where: {
        patient: { organizationId: ctx.organizationId },
        createdAt: { gte: startOfMonth },
      },
    });

    const limits = PLAN_LIMITS[org.subscriptionPlan];
    return {
      patients: { current: patientCount, max: limits.maxPatients },
      plansThisMonth: { current: plansThisMonth, max: limits.maxPlansPerMonth },
    };
  }),

  // Stripe Checkout Session erstellen (Upgrade)
  createCheckoutSession: protectedProcedure
    .input(z.object({ plan: z.enum(["BASIC", "PROFESSIONAL"]) }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripeClient();
      const org = await ctx.prisma.organization.findUniqueOrThrow({
        where: { id: ctx.organizationId },
      });

      let customerId = org.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: ctx.session.user.email!,
          name: org.name,
          metadata: { organizationId: org.id },
        });
        customerId = customer.id;
        await ctx.prisma.organization.update({
          where: { id: org.id },
          data: { stripeCustomerId: customerId },
        });
      }

      const priceId = getStripePriceId(input.plan);
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXTAUTH_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/billing`,
        metadata: { organizationId: org.id, plan: input.plan },
        allow_promotion_codes: true,
        billing_address_collection: "required",
        locale: "de",
      });

      return { url: session.url };
    }),

  // Stripe Customer Portal Session erstellen (Abo verwalten)
  createPortalSession: adminProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripeClient();
    const org = await ctx.prisma.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
    });

    if (!org.stripeCustomerId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Kein Stripe-Konto vorhanden. Bitte zuerst ein Abo abschließen.",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/billing`,
    });

    return { url: session.url };
  }),
});
