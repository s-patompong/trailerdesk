import { hashPassword } from "better-auth/crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { logInfo } from "../server/platform/logging";
import {
  account,
  member,
  organization,
  user,
} from "../server/platform/schema/auth";
import { customers, leads } from "../server/platform/schema/crm";
import { publicForms } from "../server/platform/schema/forms";
import { dealership, trailers } from "../server/platform/schema/inventory";
import {
  account as platformAccount,
  user as platformUser,
} from "../server/platform/schema/platform-auth";

import { databaseEnv } from "./database-env";
import { seedSearch } from "./seed-search";
import { waitForSeedInventory } from "./seed-wait";

const connection = databaseEnv.DATABASE_URL;
if (!["localhost", "127.0.0.1"].includes(new URL(connection).hostname))
  throw new Error(
    "Seed is local only. Production seeding requires a separate reviewed command.",
  );
const client = new pg.Client({ connectionString: connection });
await client.connect();
const db = drizzle(client);
const password = "TrailerDesk-Local-2026!";
const stores = [
  { id: "ridgeline", name: "Ridgeline Trailer Co.", slug: "ridgeline" },
  { id: "cedar", name: "Cedar Creek Trailers", slug: "cedar-creek" },
];
const kinds = [
  "utility",
  "enclosed",
  "car_hauler",
  "dump",
  "equipment",
  "gooseneck",
  "horse_livestock",
];
const makes = [
  "Big Tex",
  "Diamond C",
  "PJ Trailers",
  "Load Trail",
  "Sure-Trac",
];
async function seedIdentity() {
  await seedDealerships();
  await seedStaff();
  await seedPlatformAdmin();
}

async function seedDealerships() {
  for (const store of stores) {
    await db.insert(organization).values(store).onConflictDoNothing();
    await db
      .insert(dealership)
      .values({
        dealershipId: store.id,
        phone: "(512) 555-0148",
        address: "8400 Ranch Road, Austin, TX 78736",
        hours: "Mon–Fri 8am–6pm; Sat 9am–3pm",
        publicSite: true,
      })
      .onConflictDoNothing();
    await db
      .insert(publicForms)
      .values({
        id: `${store.id}-website-inquiry`,
        dealershipId: store.id,
        publicKey: `${store.id}-contact-form`,
        name: "Website inquiry",
        heading: "How can we help?",
        description:
          "Ask about inventory, availability, delivery, or your next trailer.",
        submitLabel: "Send to the dealership",
        successMessage:
          "Thanks! The dealership received your inquiry and will be in touch.",
        allowedOrigins: ["http://127.0.0.1:5174", "http://localhost:5174"],
      })
      .onConflictDoUpdate({
        target: publicForms.id,
        set: {
          allowedOrigins: ["http://127.0.0.1:5174", "http://localhost:5174"],
          updatedAt: new Date(),
        },
      });
  }
}

async function seedStaff() {
  for (const role of ["owner", "manager", "sales"] as const) {
    const id = `local-${role}`;
    await db
      .insert(user)
      .values({
        id,
        name: {
          owner: "Morgan Reed",
          manager: "Casey Brooks",
          sales: "Alex Taylor",
        }[role],
        email: `${role}@trailerdesk.test`,
        emailVerified: true,
      })
      .onConflictDoNothing();
    await db
      .insert(account)
      .values({
        id: `${id}-account`,
        userId: id,
        accountId: id,
        providerId: "credential",
        password: await hashPassword(password),
      })
      .onConflictDoNothing();
    await db
      .insert(member)
      .values({
        id: `${id}-ridgeline`,
        organizationId: "ridgeline",
        userId: id,
        role,
      })
      .onConflictDoNothing();
    if (role === "owner")
      await db
        .insert(member)
        .values({
          id: `${id}-cedar`,
          organizationId: "cedar",
          userId: id,
          role,
        })
        .onConflictDoNothing();
  }
}

async function seedPlatformAdmin() {
  const platformId = "local-platform-admin";
  await db
    .insert(platformUser)
    .values({
      id: platformId,
      name: "TrailerDesk Platform Admin",
      email: "platform-admin@trailerdesk.test",
      emailVerified: true,
    })
    .onConflictDoNothing();
  await db
    .insert(platformAccount)
    .values({
      id: `${platformId}-account`,
      userId: platformId,
      accountId: platformId,
      providerId: "credential",
      password: await hashPassword(password),
    })
    .onConflictDoNothing();
}
function trailerSeedRow(index: number) {
  const tenant = index < 40 ? "ridgeline" : "cedar";
  const type = kinds[index % kinds.length] ?? "utility";
  const make = makes[index % makes.length] ?? "Big Tex";
  return {
    id: `trailer-${String(index + 1)}`,
    dealershipId: tenant,
    vin: `16V1U1110T1${String(index + 100001).padStart(6, "0")}`,
    stockNumber: `RT-${String(index + 101)}`,
    year: 2026,
    make,
    model: `${type === "enclosed" ? "Cargo Pro" : type === "dump" ? "Heavy Duty Dump" : "Pro Series"} ${String(index + 1)}`,
    type,
    size: index % 2 === 0 ? "7x14" : "8.5x20",
    gvwr: [7000, 9990, 14000, 16000][index % 4] ?? 7000,
    axles: 2,
    hitchType: type === "gooseneck" ? "gooseneck" : "bumper_pull",
    doorType: type === "enclosed" ? "ramp" : "none",
    color: ["Black", "White", "Charcoal"][index % 3] ?? "Black",
    condition: index % 5 === 0 ? "used" : "new",
    lotLocation: `Row ${String.fromCharCode(65 + (index % 4))}`,
    askingPriceCents: 349900 + index * 25000,
    dealerCostCents: 249900 + index * 20000,
    status: index % 11 === 0 ? "on_order" : "in_stock",
    description: `${make} ${type.replaceAll("_", " ")} trailer with tandem axles. Ready for work around Central Texas. Ask our team about availability and towing requirements.`,
    arrivedAt: new Date(Date.now() - (index * 5 + 2) * 86400000),
  };
}
async function seedInventory() {
  for (let index = 0; index < 44; index++)
    await db
      .insert(trailers)
      .values(trailerSeedRow(index))
      .onConflictDoNothing();
}
async function seedCustomers() {
  const names = [
    "John Smith",
    "Maria Garcia",
    "James Wilson",
    "Sarah Davis",
    "Robert Miller",
  ];
  for (let index = 0; index < 27; index++) {
    const tenant = index < 25 ? "ridgeline" : "cedar";
    const customerId = `customer-${String(index + 1)}`;
    await db
      .insert(customers)
      .values({
        id: customerId,
        dealershipId: tenant,
        name: `${names[index % names.length] ?? "Pat Jones"}${index > 4 ? ` ${String(index + 1)}` : ""}`,
        email: `customer${String(index + 1)}@example.test`,
        phone: `(512) 555-${String(100 + index).padStart(4, "0")}`,
      })
      .onConflictDoNothing();
    await db
      .insert(leads)
      .values({
        id: `lead-${String(index + 1)}`,
        dealershipId: tenant,
        customerId,
        trailerId: `trailer-${String(index < 25 ? index + 1 : 41)}`,
        assignedTo: "local-owner",
        stage:
          ["new", "contacted", "quoted", "won", "lost"][index % 5] ?? "new",
        message: "Interested in trailer availability and financing options.",
        sourceKey: `seed-${String(index)}`,
        updatedAt: new Date(Date.now() - index * 86400000),
      })
      .onConflictDoNothing();
  }
}
try {
  await seedIdentity();
  await seedInventory();
  await seedCustomers();
  await seedSearch(() => waitForSeedInventory(client));
  logInfo(
    "Local starter data ready. Sign in as owner, manager or sales @trailerdesk.test using the README password. Policy documents are indexed with real Workers AI.",
  );
} finally {
  await client.end();
}
