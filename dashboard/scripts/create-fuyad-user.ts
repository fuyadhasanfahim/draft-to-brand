import "dotenv/config";
import { PrismaClient, MemberStatus } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hashPassword } from "better-auth/crypto";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const email = "codewithfuyad@gmail.com";
  const password = "54114789";
  const name = "Fuyad Hasan";

  console.log(`→ Direct DB provisioning for ${email}...`);
  
  // 1. Generate password hash
  const hashedPassword = await hashPassword(password);
  console.log(`✓ Generated password hash.`);

  // 2. Upsert/Create User record
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const userId = `usr_${Math.random().toString(36).substring(2, 15)}`;
    user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email: email.toLowerCase(),
        emailVerified: true,
      }
    });
    console.log(`✓ Created user record with ID: ${user.id}`);
  } else {
    // Ensure emailVerified is true
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true }
    });
    console.log(`✓ User record already exists with ID: ${user.id}. Ensured email is verified.`);
  }

  // 3. Upsert/Create Account record
  const existingAccount = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" }
  });

  if (!existingAccount) {
    const accountId = `acc_${Math.random().toString(36).substring(2, 15)}`;
    await prisma.account.create({
      data: {
        id: accountId,
        accountId: user.id, // For Better Auth credentials, accountId matches the userId
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      }
    });
    console.log("✓ Created credential account record.");
  } else {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: {
        password: hashedPassword,
        accountId: user.id, // Just in case it wasn't set correctly
      }
    });
    console.log("✓ Updated existing credential account with new password hash.");
  }

  // 4. Link user to main organization as owner
  console.log("→ Linking user as Owner of Draft To Brand organization...");
  const mainOrg = await prisma.organization.findUnique({ where: { slug: "draft-to-brand" } });
  if (!mainOrg) {
    throw new Error("Main organization 'draft-to-brand' not found. Please seed the mock data first.");
  }

  const ownerRole = await prisma.role.findFirst({
    where: { organizationId: mainOrg.id, slug: "owner" }
  });
  if (!ownerRole) {
    throw new Error("Owner role not found in organization.");
  }

  // Check if membership already exists
  const existingMember = await prisma.member.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: mainOrg.id } }
  });

  if (!existingMember) {
    const member = await prisma.member.create({
      data: {
        userId: user.id,
        organizationId: mainOrg.id,
        roleId: ownerRole.id,
        status: MemberStatus.ACTIVE,
        jobTitle: "Owner & CEO",
      }
    });
    console.log(`✓ Member profile created with ID: ${member.id}`);
  } else {
    // Update existing member to owner
    const member = await prisma.member.update({
      where: { id: existingMember.id },
      data: {
        roleId: ownerRole.id,
        status: MemberStatus.ACTIVE,
        jobTitle: "Owner & CEO",
      }
    });
    console.log(`✓ Existing member updated to Owner. Member ID: ${member.id}`);
  }

  console.log("\n=== Account Provisioned Successfully ===");
  console.log(`Email    : ${email}`);
  console.log(`Password : ${password}`);
  console.log(`Role     : Owner (${mainOrg.name})`);
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error("✗ Failed to provision user:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
