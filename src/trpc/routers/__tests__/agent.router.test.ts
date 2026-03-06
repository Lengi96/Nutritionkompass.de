import assert from "node:assert/strict";
import { TRPCError } from "@trpc/server";
import { agentRouter } from "@/trpc/routers/agent";

type MockPrisma = {
  patient: {
    findFirst: (...args: unknown[]) => Promise<unknown>;
    findMany: (...args: unknown[]) => Promise<unknown[]>;
    create: (...args: unknown[]) => Promise<{ id: string }>;
  };
  weightEntry: {
    create: (...args: unknown[]) => Promise<{ id: string }>;
  };
  mealPlan: {
    create: (...args: unknown[]) => Promise<{ id: string }>;
  };
  agentAuditLog: {
    create: (...args: unknown[]) => Promise<{ id: string }>;
  };
  $transaction: <T>(fn: (tx: MockPrisma) => Promise<T>) => Promise<T>;
};

function createMockPrisma(): MockPrisma {
  const prisma = {
    patient: {
      findFirst: async () => null,
      findMany: async () => [],
      create: async () => ({ id: "pat-new-1" }),
    },
    weightEntry: {
      create: async () => ({ id: "weight-new-1" }),
    },
    mealPlan: {
      create: async () => ({ id: "plan-new-1" }),
    },
    agentAuditLog: {
      create: async () => ({ id: "audit-1" }),
    },
    $transaction: async <T>(fn: (tx: MockPrisma) => Promise<T>): Promise<T> =>
      fn(prisma),
  };
  return prisma;
}

async function expectTrpcCode(
  fn: () => Promise<unknown>,
  code: TRPCError["code"]
) {
  try {
    await fn();
    assert.fail(`Expected TRPCError ${code}`);
  } catch (error) {
    assert.ok(error instanceof TRPCError);
    assert.equal(error.code, code);
  }
}

async function run() {
  const unauthorized = agentRouter.createCaller({
    session: null,
    prisma: createMockPrisma(),
  } as never);

  await expectTrpcCode(
    () =>
      unauthorized.commit({
        proposedActions: [
          {
            type: "PATIENT_CREATE",
            data: {
              pseudonym: "Neu",
              birthYear: 2008,
              currentWeight: 50,
              targetWeight: 55,
            },
          },
        ],
      }),
    "UNAUTHORIZED"
  );

  const outOfOrgPrisma = createMockPrisma();
  outOfOrgPrisma.patient.findFirst = async () => null;
  const outOfOrgCaller = agentRouter.createCaller({
    session: {
      user: { id: "u1", role: "ADMIN", organizationId: "org-1" },
    },
    prisma: outOfOrgPrisma,
  } as never);

  await expectTrpcCode(
    () =>
      outOfOrgCaller.commit({
        proposedActions: [
          {
            type: "WEIGHT_ADD",
            data: {
              patient: { by: "id", value: "foreign-patient" },
              weightKg: 53,
              date: "2026-03-05",
            },
          },
        ],
      }),
    "FORBIDDEN"
  );

  const ambiguousPrisma = createMockPrisma();
  ambiguousPrisma.patient.findMany = async () => [{ id: "p1" }, { id: "p2" }];
  const ambiguousCaller = agentRouter.createCaller({
    session: {
      user: { id: "u2", role: "ADMIN", organizationId: "org-1" },
    },
    prisma: ambiguousPrisma,
  } as never);

  await expectTrpcCode(
    () =>
      ambiguousCaller.commit({
        proposedActions: [
          {
            type: "WEIGHT_ADD",
            data: {
              patient: { by: "pseudonym", value: "Doppelname" },
              weightKg: 54,
              date: "2026-03-05",
            },
          },
        ],
      }),
    "BAD_REQUEST"
  );
}

run().then(() => console.log("Agent router tests passed."));
