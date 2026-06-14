/**
 * Phase 0 seed.
 *
 *  - Inserts the Permission registry (idempotent on `key`)
 *  - Creates the default Organization (if missing)
 *  - Creates all System roles for that org with their permission grants
 *  - Creates an Owner User via Better Auth and links them as the Owner Member
 *
 * Run with: `npm run db:seed`
 * Re-runnable safely.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { auth } from "../src/lib/auth/server";
import { PERMISSIONS, SYSTEM_ROLES } from "../src/lib/permissions/registry";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "owner@drafttobrand.local";
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "ChangeMe!2026";
const OWNER_NAME = process.env.SEED_OWNER_NAME ?? "Workspace Owner";
const ORG_NAME = process.env.SEED_ORG_NAME ?? "Draft To Brand";
const ORG_SLUG = process.env.SEED_ORG_SLUG ?? "draft-to-brand";

async function main() {
  console.log("→ Seeding permissions…");
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { resource: p.resource, action: p.action, description: p.description },
      create: p,
    });
  }
  const allPermissions = await prisma.permission.findMany();
  const permByKey = new Map(allPermissions.map((p) => [p.key, p]));

  console.log("→ Seeding organization…");
  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: { name: ORG_NAME },
    create: { name: ORG_NAME, slug: ORG_SLUG },
  });

  console.log("→ Seeding system roles…");
  let ownerRoleId: string | null = null;
  for (const def of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { organizationId_slug: { organizationId: org.id, slug: def.slug } },
      update: {
        name: def.name,
        description: def.description,
        isSystem: true,
        priority: def.priority,
      },
      create: {
        organizationId: org.id,
        slug: def.slug,
        name: def.name,
        description: def.description,
        isSystem: true,
        priority: def.priority,
      },
    });
    if (def.slug === "owner") ownerRoleId = role.id;

    const keys = def.permissions === "*"
      ? allPermissions.map((p) => p.key)
      : def.permissions;

    // Reset role permission set (idempotent + handles registry shrink/grow)
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: keys
        .map((k) => permByKey.get(k))
        .filter(Boolean)
        .map((p) => ({ roleId: role.id, permissionId: p!.id })),
      skipDuplicates: true,
    });
  }
  if (!ownerRoleId) throw new Error("Owner role missing after seed");

  console.log("→ Seeding owner user via Better Auth…");
  const existing = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  let ownerUserId = existing?.id ?? null;

  if (!ownerUserId) {
    const result = await auth.api.signUpEmail({
      body: { name: OWNER_NAME, email: OWNER_EMAIL, password: OWNER_PASSWORD },
    });
    ownerUserId = result.user.id;
    console.log(`   created auth user: ${OWNER_EMAIL}`);
  } else {
    console.log(`   owner user already exists: ${OWNER_EMAIL}`);
  }

  console.log("→ Seeding owner member profile…");
  await prisma.member.upsert({
    where: { userId_organizationId: { userId: ownerUserId!, organizationId: org.id } },
    update: { roleId: ownerRoleId, status: "ACTIVE" },
    create: {
      userId: ownerUserId!,
      organizationId: org.id,
      roleId: ownerRoleId,
      status: "ACTIVE",
      jobTitle: "Founder",
    },
  });

  console.log("\n✓ Seed complete");
  console.log(`  Organization : ${ORG_NAME} (${ORG_SLUG})`);
  console.log(`  Owner login  : ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log("  Change the password after first sign-in.\n");
}

main()
  .catch((e) => {
    console.error("\n✗ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
