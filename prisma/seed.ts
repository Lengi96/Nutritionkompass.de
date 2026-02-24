import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starte Seeding...");

  // Organisation erstellen
  const organization = await prisma.organization.upsert({
    where: { id: "demo-org-1" },
    update: {},
    create: {
      id: "demo-org-1",
      name: "Jugendwohngruppe Sonnenhof",
    },
  });

  console.log("Organisation erstellt:", organization.name);

  // Admin-User erstellen (Passwort: Passwort123!)
  const passwordHash = await hash("Passwort123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@mein-nutrikompass.de" },
    update: {},
    create: {
      email: "admin@mein-nutrikompass.de",
      name: "Anna Schmidt",
      passwordHash,
      role: "ADMIN",
      organizationId: organization.id,
    },
  });

  console.log("Admin erstellt:", admin.email);

  // Staff-User erstellen
  const staff = await prisma.user.upsert({
    where: { email: "mitarbeiter@mein-nutrikompass.de" },
    update: {},
    create: {
      email: "mitarbeiter@mein-nutrikompass.de",
      name: "Max Weber",
      passwordHash,
      role: "STAFF",
      organizationId: organization.id,
    },
  });

  console.log("Mitarbeiter erstellt:", staff.email);

  // Test-Patienten erstellen
  const patient1 = await prisma.patient.create({
    data: {
      pseudonym: "Sonnenschein",
      birthYear: 2008,
      currentWeight: 48.5,
      targetWeight: 55.0,
      allergies: ["Laktose"],
      notes: "Bevorzugt warme Mahlzeiten. Mag gerne Nudeln und Reis.",
      organizationId: organization.id,
      createdBy: admin.id,
    },
  });

  // Gewichtsverlauf für Patient 1
  const weightEntries1 = [
    { weight: 45.0, daysAgo: 60 },
    { weight: 46.2, daysAgo: 45 },
    { weight: 47.1, daysAgo: 30 },
    { weight: 47.8, daysAgo: 15 },
    { weight: 48.5, daysAgo: 0 },
  ];

  for (const entry of weightEntries1) {
    const date = new Date();
    date.setDate(date.getDate() - entry.daysAgo);
    await prisma.weightEntry.create({
      data: {
        patientId: patient1.id,
        weightKg: entry.weight,
        recordedAt: date,
        recordedBy: admin.id,
      },
    });
  }

  console.log("Patient erstellt:", patient1.pseudonym);

  const patient2 = await prisma.patient.create({
    data: {
      pseudonym: "Mondlicht",
      birthYear: 2006,
      currentWeight: 52.0,
      targetWeight: 58.0,
      allergies: ["Gluten", "Nüsse"],
      notes: "Vegetarische Ernährung bevorzugt.",
      organizationId: organization.id,
      createdBy: admin.id,
    },
  });

  await prisma.weightEntry.create({
    data: {
      patientId: patient2.id,
      weightKg: 52.0,
      recordedBy: admin.id,
    },
  });

  console.log("Patient erstellt:", patient2.pseudonym);

  const patient3 = await prisma.patient.create({
    data: {
      pseudonym: "Sternschnuppe",
      birthYear: 2009,
      currentWeight: 42.0,
      targetWeight: 50.0,
      allergies: [],
      notes: "",
      organizationId: organization.id,
      createdBy: staff.id,
    },
  });

  await prisma.weightEntry.create({
    data: {
      patientId: patient3.id,
      weightKg: 42.0,
      recordedBy: staff.id,
    },
  });

  console.log("Patient erstellt:", patient3.pseudonym);

  console.log("\nSeeding abgeschlossen!");
  console.log("---");
  console.log("Admin-Login: admin@mein-nutrikompass.de / Passwort123!");
  console.log("Staff-Login: mitarbeiter@mein-nutrikompass.de / Passwort123!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
