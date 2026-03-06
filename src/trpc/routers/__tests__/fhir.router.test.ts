import assert from "node:assert/strict";
import { TRPCError } from "@trpc/server";
import { fhirRouter } from "@/trpc/routers/fhir";

type MockPrisma = {
  patient: { findUnique: (...args: unknown[]) => Promise<unknown> };
  weightEntry: { findMany: (...args: unknown[]) => Promise<unknown[]> };
  mealPlan: { findMany: (...args: unknown[]) => Promise<unknown[]> };
  fhirExportAuditLog: { create: (...args: unknown[]) => Promise<unknown> };
};

function createMockPrisma(): MockPrisma {
  return {
    patient: {
      findUnique: async () => null,
    },
    weightEntry: {
      findMany: async () => [],
    },
    mealPlan: {
      findMany: async () => [],
    },
    fhirExportAuditLog: {
      create: async () => ({ id: "audit-1" }),
    },
  };
}

async function assertRejectsWithCode(
  fn: () => Promise<unknown>,
  expectedCode: TRPCError["code"]
) {
  try {
    await fn();
    assert.fail(`Expected TRPCError ${expectedCode}`);
  } catch (error) {
    assert.ok(error instanceof TRPCError);
    assert.equal(error.code, expectedCode);
  }
}

async function run() {
  const unauthorizedCaller = fhirRouter.createCaller({
    session: null,
    prisma: createMockPrisma(),
  } as never);

  await assertRejectsWithCode(
    () =>
      unauthorizedCaller.exportPatientBundle({
        patientId: "pat-1",
        include: { weight: true, mealPlans: true, shoppingLists: false },
      }),
    "UNAUTHORIZED"
  );

  const crossTenantPrisma = createMockPrisma();
  crossTenantPrisma.patient.findUnique = async () => ({
    id: "pat-2",
    pseudonym: "PSEUDO",
    organizationId: "org-foreign",
  });

  const crossTenantCaller = fhirRouter.createCaller({
    session: {
      user: {
        id: "u-1",
        role: "ADMIN",
        organizationId: "org-own",
      },
    },
    prisma: crossTenantPrisma,
  } as never);

  await assertRejectsWithCode(
    () =>
      crossTenantCaller.exportPatientBundle({
        patientId: "pat-2",
        include: { weight: true, mealPlans: false, shoppingLists: false },
      }),
    "FORBIDDEN"
  );

  let auditCallCount = 0;
  const okPrisma = createMockPrisma();
  okPrisma.patient.findUnique = async () => ({
    id: "pat-3",
    pseudonym: "PSEUDO-GAMMA",
    organizationId: "org-1",
  });
  okPrisma.weightEntry.findMany = async () => [
    {
      id: "w-1",
      patientId: "pat-3",
      weightKg: 51.2,
      recordedAt: new Date("2026-02-01T10:00:00.000Z"),
    },
  ];
  okPrisma.fhirExportAuditLog.create = async () => {
    auditCallCount += 1;
    return { id: "audit-2" };
  };

  const okCaller = fhirRouter.createCaller({
    session: {
      user: {
        id: "u-2",
        role: "ADMIN",
        organizationId: "org-1",
      },
    },
    prisma: okPrisma,
  } as never);

  const result = await okCaller.exportPatientBundle({
    patientId: "pat-3",
    include: { weight: true, mealPlans: false, shoppingLists: false },
  });

  assert.equal(result.bundle.resourceType, "Bundle");
  assert.equal(result.bundle.type, "collection");
  assert.equal(result.bundle.entry[0]?.resource.resourceType, "Patient");
  assert.equal(auditCallCount, 1);
}

run().then(() => {
  console.log("FHIR router tests passed.");
});
