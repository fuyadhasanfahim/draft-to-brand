/**
 * Re-sync the permission registry into every organization in the database.
 *
 *   1. Upserts every PERMISSION key (additions land; descriptions update).
 *   2. For every organization, re-syncs every SYSTEM role's permission set
 *      from the registry. Custom (non-system) roles are NOT touched.
 *
 * Use after adding new permission keys (Phase 2A added 8 new ones).
 * Safe to re-run.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PERMISSIONS, SYSTEM_ROLES } from "../src/lib/permissions/registry";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log("→ Upserting permission registry…");
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { resource: p.resource, action: p.action, description: p.description },
      create: p,
    });
  }
  const allPermissions = await prisma.permission.findMany();
  const permByKey = new Map(allPermissions.map((p) => [p.key, p]));

  const orgs = await prisma.organization.findMany({ select: { id: true, name: true, slug: true } });
  console.log(`→ Re-syncing ${orgs.length} organization(s)…`);

  for (const org of orgs) {
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

      const keys =
        def.permissions === "*"
          ? allPermissions.map((p) => p.key)
          : def.permissions;

      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
      await prisma.rolePermission.createMany({
        data: keys
          .map((k) => permByKey.get(k))
          .filter(Boolean)
          .map((p) => ({ roleId: role.id, permissionId: p!.id })),
        skipDuplicates: true,
      });
    }
    console.log(`  ✓ ${org.name} (${org.slug})`);
  }

  console.log("\n✓ Permission registry re-sync complete.");
}

main()
  .catch((e) => {
    console.error("\n✗ Re-sync failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
