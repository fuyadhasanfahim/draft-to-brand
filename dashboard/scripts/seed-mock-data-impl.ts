import { PrismaClient, MemberStatus, LeadStatus, LeadPriority, StageOutcome, Currency, ClientStatus, OnboardingStatus, EmailCampaignStatus, EmailRecipientStatus, EmailEventType, SequenceStepCondition, SequenceEnrollmentStatus, SuppressionReason, EmailDeliveryScope } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PERMISSIONS, SYSTEM_ROLES } from "../src/lib/permissions/registry";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

// Helper for random picking
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

// Mock data pools
const ORG_NAMES = [
  "Draft To Brand", "Apex Marketing", "Elevate Brand Group", "Vortex Social", "Quantum PR", 
  "Blue Horizon Agency", "Pixel Perfect Media", "Spark Digital", "Summit Outreach", "Launchpad Creative", 
  "Optima Marketing Group", "Zenith Brand Partners", "NextGen Outbound", "Catalyst Social", "Echo Digital", 
  "Radiant Creative", "Stellar PR", "Velocity Growth", "Inception Creative", "Pinnacle Social", 
  "Prism Marketing", "Alpha Outreach", "Omega Digital", "Horizon PR", "Delta Media", 
  "Nova Brand Lab", "Pulse Creative", "Ignite Social", "Sync Digital", "Matrix Marketing", 
  "Core Creative", "Gravity Growth", "Impact Social", "Direct Media", "Scale Outbound", 
  "Lumina Brand Lab", "Vanguard Creative", "Pioneer Media", "Nexus Digital", "Summit Growth", 
  "Beacon Outreach", "Frontier PR", "Core Outreach", "Alliance Media", "Synergy Social", 
  "Dynamic Growth", "Enterprise Creative", "Global Marketing", "Unified PR", "Visionary Digital"
];

const CITIES = ["New York", "London", "Dhaka", "Sydney", "Toronto", "Tokyo", "Berlin", "Singapore", "Paris", "Dubai"];
const COUNTRIES_LIST = ["US", "GB", "BD", "AU", "CA", "JP", "DE", "SG", "FR", "AE"];

const DEPARTMENTS = [
  "Marketing", "Sales", "Human Resources", "Engineering", "Design", 
  "Customer Success", "Operations", "Finance", "Legal", "Support"
];

const TEAMS = [
  "SEO Team", "Social Media Team", "Outbound Sales Team", "Inbound Sales Team", 
  "Billing Team", "Content Writing Team", "Paid Ads Team", "Influencer Team", 
  "Web Dev Team", "Design Team"
];

const FIRST_NAMES = [
  "John", "Jane", "Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah",
  "Ian", "Julia", "Kevin", "Laura", "Michael", "Nora", "Oscar", "Penelope", "Richard", "Sarah",
  "Thomas", "Victoria", "William", "Xavier", "Yolanda", "Zachary", "Harry", "Hermione", "Ron", "Albus",
  "Severus", "Rubeus", "Draco", "Minerva", "Sirius", "Remus", "Peter", "James", "Lily", "Neville",
  "Luna", "Ginny", "Fred", "GeorgeW", "Percy", "CharlieW", "Bill", "Arthur", "Molly", "Fleur"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson",
  "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White",
  "Lopez", "Lee", "Gonzalez", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Perez", "Hall",
  "Potter", "Granger", "Weasley", "Dumbledore", "Snape", "Hagrid", "Malfoy", "McGonagall", "Black", "Lupin",
  "Pettigrew", "Longbottom", "Lovegood", "Delacour", "Diggory", "Lestrange", "Riddle", "Vane", "Tonks", "Moody"
];

const COMPANIES = [
  "Acme Corp", "Globex Corporation", "Initech", "Umbrella Corp", "Hooli", "Soylent Corp", "Weyland-Yutani", 
  "Tyrell Corp", "Cyberdyne Systems", "Vehement Capital", "Stark Industries", "Wayne Enterprises", "Oscorp", 
  "LexCorp", "Dunder Mifflin", "Sterling Cooper", "Prestige Worldwide", "Gekko & Co", "Duke & Duke", "BLUTH Company", 
  "Aperture Science", "Black Mesa", "Abstergo Industries", "Virtucon", "Massive Dynamic", "Devon Corp", "Wonka Industries", 
  "Krustyco", "Monsters Inc", "Gringotts", "Duff Beer", "Nakatomi Enterprises", "Sherlock Holmes Ltd", "Vandelay Industries", 
  "Kramerica Industries", "Jotunheim Inc", "Asgard Tech", "Midgard Group", "Valhalla Media", "Yggdrasil Solutions", 
  "Ragnarok PR", "Odin Digital", "Thor Growth", "Loki Marketing", "Freya Social", "Baldur Labs", "Heimdall Security", 
  "Frigg Creative", "Tyr Outbound", "Sleipnir Logistics"
];

const TAG_NAMES = [
  "Hot", "Cold", "Warm", "Enterprise", "SaaS", "SMB", "Partner", "Competitor", 
  "Q3 Lead", "High Value", "Referred", "Tech", "Finance", "Healthcare", "Retail",
  "Automotive", "Education", "Real Estate", "Media", "Consulting"
];

const NOTES = [
  "Discussed pricing package options. Client seemed interested in the Premium tier.",
  "Followed up via phone. Left a voicemail asking for availability next Tuesday.",
  "Scheduled a platform demo session for next Friday at 10:00 AM.",
  "Client requested custom feature sets. Shared document with the Engineering team.",
  "Had an introductory call. Identified key pain points in their current workflow.",
  "Sent proposal document. Waiting for legal department feedback.",
  "Attended networking event, discussed brand re-design project proposal.",
  "Client expressed concern about data migration timelines. Assured them of Neon support.",
  "Negotiating contract terms. Sent revised draft for review.",
  "Client is currently using a competitor but looking to switch due to support issues."
];

const CAMPAIGN_NAMES = [
  "Outbound Campaign - Q3 Outreach", "Newsletter Newsletter - June 2026", 
  "Re-engagement Campaign", "Product Launch - Feature Announcement", 
  "Event Invitation - Brand Summit 2026", "Partnership Proposal Cold Blast", 
  "Follow-up Campaign - Stale Leads", "Feedback Questionnaire - Closed Clients", 
  "Holiday Greetings 2026", "Customer Success Touchpoint"
];

const EMAIL_BODIES = [
  "Hello {{firstName}},\n\nI hope you are doing well. I wanted to reach out regarding how Draft To Brand can help scale your marketing workflows. We've helped companies in your sector increase conversion rates by up to 35%.\n\nAre you available for a quick 10-minute call next week?\n\nBest regards,\nWorkspace Team",
  "Hi {{firstName}},\n\nWe recently launched a new feature that streamlines lead tracking and customer data sync. Given your role, I thought this might be highly relevant to your daily operations.\n\nLet me know if you would like a brief demo.\n\nCheers,\nProduct Team",
  "Hello {{firstName}},\n\nI'm following up on our previous conversation. I know you've been busy, but I wanted to share this quick case study on how we redesigned Initech's brand footprint.\n\nRead more here: https://example.com/case-study\n\nThanks,\nOutreach Specialist"
];

// Pre-calculated bcrypt hash for "ChangeMe!2026"
const PASSWORD_HASH = "$2a$10$tZ2LpI5mS0rD0Jd2e4z/OeF2nO62YJcM36tWJ6L9F7Z1Lp6bU9W2m";

async function createAuthUserDirectly(name: string, email: string) {
  const userId = `usr_${Math.random().toString(36).substring(2, 15)}`;
  const accountId = `acc_${Math.random().toString(36).substring(2, 15)}`;
  
  const user = await prisma.user.create({
    data: {
      id: userId,
      name,
      email: email.toLowerCase(),
      emailVerified: true,
      accounts: {
        create: {
          id: accountId,
          accountId: email.toLowerCase(),
          providerId: "email",
          password: PASSWORD_HASH,
        }
      }
    }
  });

  return user;
}

export async function startSeeding() {
  console.log("=== 1. Wiping database tables ===");
  
  // Wipe leaf tables first to satisfy constraints
  await prisma.suppressionList.deleteMany({});
  await prisma.emailSequenceEnrollment.deleteMany({});
  await prisma.emailSequenceStep.deleteMany({});
  await prisma.emailSequence.deleteMany({});
  await prisma.emailEvent.deleteMany({});
  await prisma.emailRecipient.deleteMany({});
  await prisma.emailCampaign.deleteMany({});
  await prisma.leadActivity.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.pipelineStage.deleteMany({});
  await prisma.pipeline.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.companyTag.deleteMany({});
  await prisma.contactTag.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.leadSource.deleteMany({});
  await prisma.companySize.deleteMany({});
  await prisma.industry.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.invitation.deleteMany({});
  await prisma.emailDeliveryLog.deleteMany({});
  await prisma.userPermission.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  
  // Wipe user and organization
  await prisma.user.deleteMany({});
  await prisma.verification.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.country.deleteMany({});
  
  console.log("✓ Database wiped cleanly.");

  console.log("\n=== 2. Seeding global countries ===");
  const countriesFile = resolve(process.cwd(), "prisma/data/countries.json");
  const countriesData = JSON.parse(readFileSync(countriesFile, "utf8")) as any[];
  await prisma.country.createMany({ data: countriesData });
  const allCountries = await prisma.country.findMany();
  console.log(`✓ Seeded ${allCountries.length} countries.`);

  console.log("\n=== 3. Seeding permissions registry ===");
  await prisma.permission.createMany({
    data: PERMISSIONS,
    skipDuplicates: true,
  });
  const allPermissions = await prisma.permission.findMany();
  const permByKey = new Map(allPermissions.map((p) => [p.key, p]));
  console.log(`✓ Seeded ${allPermissions.length} permissions.`);

  console.log("\n=== 4. Seeding 50 organizations ===");
  const orgs: any[] = [];
  // First org is the main one
  const mainOrg = await prisma.organization.create({
    data: {
      name: "Draft To Brand",
      slug: "draft-to-brand",
    }
  });
  orgs.push(mainOrg);

  // Other 49 dummy orgs
  for (let i = 1; i <= 49; i++) {
    const orgName = ORG_NAMES[i] || `Dummy Org ${i}`;
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const org = await prisma.organization.create({
      data: {
        name: orgName,
        slug: slug,
      }
    });
    orgs.push(org);
  }
  console.log(`✓ Seeded ${orgs.length} organizations.`);

  console.log("\n=== 5. Seeding system roles per organization ===");
  const rolesByOrg = new Map<string, Map<string, string>>();
  
  for (const org of orgs) {
    const orgRoleMap = new Map<string, string>();
    for (const def of SYSTEM_ROLES) {
      const role = await prisma.role.create({
        data: {
          organizationId: org.id,
          slug: def.slug,
          name: def.name,
          description: def.description,
          isSystem: true,
          priority: def.priority,
        }
      });
      orgRoleMap.set(def.slug, role.id);

      const keys = def.permissions === "*"
        ? allPermissions.map((p) => p.key)
        : def.permissions;

      await prisma.rolePermission.createMany({
        data: keys
          .map((k) => permByKey.get(k))
          .filter(Boolean)
          .map((p) => ({ roleId: role.id, permissionId: p!.id })),
      });
    }
    rolesByOrg.set(org.id, orgRoleMap);
  }
  console.log("✓ System roles and permissions mapped for all organizations.");

  console.log("\n=== 6. Seeding owner and staff users directly in DB (total 75 users) ===");
  const users: any[] = [];
  
  // Seed main owner
  const OWNER_EMAIL = "owner@drafttobrand.local";
  const ownerUser = await createAuthUserDirectly("Workspace Owner", OWNER_EMAIL);
  users.push(ownerUser);
  console.log(`  Created owner user: ${OWNER_EMAIL}`);

  // Seed 74 employee/staff users directly
  for (let i = 1; i <= 74; i++) {
    const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`;
    const email = `staff${i}@drafttobrand.local`;
    const user = await createAuthUserDirectly(name, email);
    users.push(user);
    if (i % 25 === 0) {
      console.log(`  Created ${i} staff users...`);
    }
  }
  console.log(`✓ Seeded ${users.length} total users directly.`);

  console.log("\n=== 7. Seeding members in organizations ===");
  const membersByOrg = new Map<string, any[]>();
  const mainOrgMembers: any[] = [];
  
  const ownerRoleId = rolesByOrg.get(mainOrg.id)!.get("owner")!;
  const mainOwnerMember = await prisma.member.create({
    data: {
      userId: users[0].id,
      organizationId: mainOrg.id,
      roleId: ownerRoleId,
      status: MemberStatus.ACTIVE,
      jobTitle: "Founder & CEO",
    }
  });
  mainOrgMembers.push(mainOwnerMember);

  const mainOrgRoles = ["admin", "manager", "team-lead", "hr", "employee"];
  const jobTitles = ["VP of Sales", "Marketing Manager", "HR Generalist", "Team Lead", "Copywriter", "SEO Specialist", "Developer"];
  
  for (let i = 1; i <= 49; i++) {
    const user = users[i];
    const roleSlug = mainOrgRoles[i % mainOrgRoles.length];
    const roleId = rolesByOrg.get(mainOrg.id)!.get(roleSlug)!;
    const member = await prisma.member.create({
      data: {
        userId: user.id,
        organizationId: mainOrg.id,
        roleId: roleId,
        status: MemberStatus.ACTIVE,
        jobTitle: pickRandom(jobTitles),
        joinedAt: new Date(Date.now() - randomInt(1, 365) * 24 * 60 * 60 * 1000),
      }
    });
    mainOrgMembers.push(member);
  }
  membersByOrg.set(mainOrg.id, mainOrgMembers);

  for (let i = 1; i < orgs.length; i++) {
    const org = orgs[i];
    const user = users[50 + (i % 25)];
    const ownerRoleId = rolesByOrg.get(org.id)!.get("owner")!;
    const member = await prisma.member.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        roleId: ownerRoleId,
        status: MemberStatus.ACTIVE,
        jobTitle: "Workspace Owner",
      }
    });
    membersByOrg.set(org.id, [member]);
  }
  console.log(`✓ Mapped members across all organizations. Main org has ${mainOrgMembers.length} members.`);

  console.log("\n=== 8. Seeding org graph details (Branches, Departments, Teams) ===");
  const mainOrgBranches: any[] = [];
  const mainOrgDepartments: any[] = [];
  const mainOrgTeams: any[] = [];

  for (let i = 0; i < 50; i++) {
    // Branches
    const cityName = CITIES[i % CITIES.length];
    const branchName = i === 0 ? "Dhaka Headquarters" : `${cityName} Office ${Math.ceil((i + 1) / CITIES.length)}`;
    const branchSlug = branchName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const branch = await prisma.branch.create({
      data: {
        organizationId: mainOrg.id,
        name: branchName,
        slug: branchSlug,
        city: cityName,
        country: pickRandom(COUNTRIES_LIST),
        isHeadquarter: i === 0,
        address: `${randomInt(1, 999)} Main Street, Suite ${randomInt(100, 900)}`,
      }
    });
    mainOrgBranches.push(branch);

    // Departments
    const deptTemplate = DEPARTMENTS[i % DEPARTMENTS.length];
    const deptName = `${deptTemplate} Department ${Math.ceil((i + 1) / DEPARTMENTS.length)}`;
    const deptSlug = deptName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const dept = await prisma.department.create({
      data: {
        organizationId: mainOrg.id,
        branchId: branch.id,
        name: deptName,
        slug: deptSlug,
        description: `Department focused on ${deptTemplate.toLowerCase()} operations.`,
      }
    });
    mainOrgDepartments.push(dept);

    // Teams
    const teamTemplate = TEAMS[i % TEAMS.length];
    const teamName = `${teamTemplate} ${Math.ceil((i + 1) / TEAMS.length)}`;
    const teamSlug = teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const randomMember = pickRandom(mainOrgMembers);
    const team = await prisma.team.create({
      data: {
        organizationId: mainOrg.id,
        branchId: branch.id,
        departmentId: dept.id,
        name: teamName,
        slug: teamSlug,
        description: `Focused execution group for ${teamTemplate.toLowerCase()}.`,
        teamLeadId: randomMember.id,
      }
    });
    mainOrgTeams.push(team);
  }

  for (let i = 1; i < orgs.length; i++) {
    const org = orgs[i];
    const branch = await prisma.branch.create({
      data: {
        organizationId: org.id,
        name: "Main Branch",
        slug: "main-branch",
        isHeadquarter: true,
      }
    });
    const dept = await prisma.department.create({
      data: {
        organizationId: org.id,
        branchId: branch.id,
        name: "General Operations",
        slug: "general-operations",
      }
    });
    await prisma.team.create({
      data: {
        organizationId: org.id,
        branchId: branch.id,
        departmentId: dept.id,
        name: "Ops Team",
        slug: "ops-team",
      }
    });
  }

  for (const m of mainOrgMembers) {
    if (m.userId === users[0].id) continue;
    await prisma.member.update({
      where: { id: m.id },
      data: {
        branchId: pickRandom(mainOrgBranches).id,
        departmentId: pickRandom(mainOrgDepartments).id,
        teamId: pickRandom(mainOrgTeams).id,
      }
    });
  }
  
  console.log(`✓ Branches, Departments, and Teams seeded. DB totals: 99 Branches, 99 Departments, 99 Teams.`);

  console.log("\n=== 9. Seeding dynamic taxonomies per organization ===");
  const industriesByOrg = new Map<string, any[]>();
  const sizesByOrg = new Map<string, any[]>();
  const sourcesByOrg = new Map<string, any[]>();

  const defaultIndustries = [
    { name: "Software & Technology", slug: "software-tech" },
    { name: "Financial Services", slug: "finance" },
    { name: "Healthcare & Biotech", slug: "healthcare" },
    { name: "Retail & E-commerce", slug: "retail" },
    { name: "Education & Edtech", slug: "education" },
    { name: "Real Estate & Construction", slug: "real-estate" },
    { name: "Media & Entertainment", slug: "media" },
    { name: "Professional Services", slug: "services" },
    { name: "Manufacturing & Logistics", slug: "manufacturing" },
    { name: "Food & Beverage", slug: "food-beverage" }
  ];

  const defaultSizes = [
    { name: "1-10 Employees", slug: "1-10", sortOrder: 1 },
    { name: "11-50 Employees", slug: "11-50", sortOrder: 2 },
    { name: "51-200 Employees", slug: "51-200", sortOrder: 3 },
    { name: "201-500 Employees", slug: "201-500", sortOrder: 4 },
    { name: "501-1000 Employees", slug: "501-1000", sortOrder: 5 },
    { name: "1000+ Employees", slug: "1000+", sortOrder: 6 }
  ];

  const defaultSources = [
    { name: "Cold Outreach", slug: "cold-outreach", color: "#3b82f6" },
    { name: "Inbound Lead", slug: "inbound", color: "#10b981" },
    { name: "Referral", slug: "referral", color: "#8b5cf6" },
    { name: "Social Media", slug: "social-media", color: "#ec4899" },
    { name: "Website Organic", slug: "website", color: "#f59e0b" },
    { name: "Partner", slug: "partner", color: "#6b7280" },
    { name: "Paid Ads", slug: "paid-ads", color: "#ef4444" },
    { name: "Event / Webinar", slug: "event", color: "#06b6d4" }
  ];

  for (const org of orgs) {
    const inds: any[] = [];
    for (const ind of defaultIndustries) {
      const created = await prisma.industry.create({
        data: { ...ind, organizationId: org.id }
      });
      inds.push(created);
    }
    industriesByOrg.set(org.id, inds);

    const sizes: any[] = [];
    for (const size of defaultSizes) {
      const created = await prisma.companySize.create({
        data: { ...size, organizationId: org.id }
      });
      sizes.push(created);
    }
    sizesByOrg.set(org.id, sizes);

    const sources: any[] = [];
    for (const src of defaultSources) {
      const created = await prisma.leadSource.create({
        data: { ...src, organizationId: org.id }
      });
      sources.push(created);
    }
    sourcesByOrg.set(org.id, sources);
  }
  console.log("✓ Dynamic reference taxonomies seeded.");

  console.log("\n=== 10. Seeding default pipelines per organization ===");
  const pipelinesByOrg = new Map<string, any>();
  const stagesByPipeline = new Map<string, any[]>();

  const defaultStages = [
    { name: "Lead In", slug: "lead-in", sortOrder: 10, winProbability: 10, outcome: StageOutcome.OPEN, color: "#9ca3af" },
    { name: "Contacted", slug: "contacted", sortOrder: 20, winProbability: 20, outcome: StageOutcome.OPEN, color: "#60a5fa" },
    { name: "Meeting Scheduled", slug: "meeting-scheduled", sortOrder: 30, winProbability: 50, outcome: StageOutcome.OPEN, color: "#fbbf24" },
    { name: "Proposal Sent", slug: "proposal-sent", sortOrder: 40, winProbability: 75, outcome: StageOutcome.OPEN, color: "#a78bfa" },
    { name: "Closed Won", slug: "closed-won", sortOrder: 50, winProbability: 100, outcome: StageOutcome.WON, color: "#34d399" },
    { name: "Closed Lost", slug: "closed-lost", sortOrder: 60, winProbability: 0, outcome: StageOutcome.LOST, color: "#f87171" }
  ];

  for (const org of orgs) {
    const pipeline = await prisma.pipeline.create({
      data: {
        organizationId: org.id,
        name: "Standard Sales Pipeline",
        slug: "standard-sales-pipeline",
        description: "The primary sales process for leads.",
        isDefault: true,
      }
    });
    pipelinesByOrg.set(org.id, pipeline);

    const stages: any[] = [];
    for (const stg of defaultStages) {
      const stage = await prisma.pipelineStage.create({
        data: {
          pipelineId: pipeline.id,
          name: stg.name,
          slug: stg.slug,
          color: stg.color,
          sortOrder: stg.sortOrder,
          winProbability: stg.winProbability,
          outcome: stg.outcome,
        }
      });
      stages.push(stage);
    }
    stagesByPipeline.set(pipeline.id, stages);
  }
  console.log("✓ Sales pipelines and stages seeded.");

  console.log("\n=== 11. Seeding CRM Companies & Contacts (75 items for Main Org) ===");
  const mainOrgCompanies: any[] = [];
  const mainOrgContacts: any[] = [];
  
  const mainMembers = membersByOrg.get(mainOrg.id)!;
  const mainInds = industriesByOrg.get(mainOrg.id)!;
  const mainSizes = sizesByOrg.get(mainOrg.id)!;
  const mainSources = sourcesByOrg.get(mainOrg.id)!;

  for (let i = 0; i < 75; i++) {
    // Companies
    const compName = COMPANIES[i % COMPANIES.length] + (i >= COMPANIES.length ? ` ${Math.ceil((i+1)/COMPANIES.length)}` : "");
    const compSlug = compName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const company = await prisma.company.create({
      data: {
        organizationId: mainOrg.id,
        name: compName,
        slug: compSlug,
        website: `https://www.${compSlug}.example.com`,
        description: `Leading provider of services under ${compName}.`,
        city: pickRandom(CITIES),
        address: `${randomInt(1, 999)} Business Park, Suite ${randomInt(10, 90)}`,
        phone: `+1-555-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
        email: `info@${compSlug}.example.com`,
        industryId: pickRandom(mainInds).id,
        companySizeId: pickRandom(mainSizes).id,
        countryId: pickRandom(allCountries).id,
        leadSourceId: pickRandom(mainSources).id,
        ownerId: pickRandom(mainMembers).id,
        createdById: users[0].id,
      }
    });
    mainOrgCompanies.push(company);

    // Contacts
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length] + (i >= LAST_NAMES.length ? ` ${Math.ceil((i+1)/LAST_NAMES.length)}` : "");
    const contactEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, "")}@${compSlug}.example.com`;
    const contact = await prisma.contact.create({
      data: {
        organizationId: mainOrg.id,
        companyId: company.id,
        firstName: firstName,
        lastName: lastName,
        email: contactEmail,
        phone: `+1-555-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
        jobTitle: pickRandom(["CEO", "CTO", "Marketing Manager", "Operations Director", "Sales Lead", "Product Manager"]),
        linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase().replace(/\s+/g, "")}`,
        notes: `Initial contact established. Prefers email communication.`,
        createdById: users[0].id,
      }
    });
    mainOrgContacts.push(contact);

    // Set contact as company primary contact
    await prisma.company.update({
      where: { id: company.id },
      data: { primaryContactId: contact.id }
    });
  }

  // Seed 1 company + contact for remaining 49 dummy orgs
  for (let i = 1; i < orgs.length; i++) {
    const org = orgs[i];
    const member = membersByOrg.get(org.id)![0];
    const company = await prisma.company.create({
      data: {
        organizationId: org.id,
        name: "Test Client LLC",
        slug: "test-client-llc",
        ownerId: member.id,
      }
    });
    const contact = await prisma.contact.create({
      data: {
        organizationId: org.id,
        companyId: company.id,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
      }
    });
    await prisma.company.update({
      where: { id: company.id },
      data: { primaryContactId: contact.id }
    });
  }

  console.log(`✓ Companies & Contacts seeded. DB totals: 124 Companies, 124 Contacts.`);

  console.log("\n=== 12. Seeding CRM Tags & Notes (50 Tags, 75 Notes for Main Org) ===");
  const mainOrgTags: any[] = [];
  
  // Tags
  for (let i = 0; i < 50; i++) {
    const tagName = TAG_NAMES[i % TAG_NAMES.length] + (i >= TAG_NAMES.length ? ` ${Math.ceil((i+1)/TAG_NAMES.length)}` : "");
    const tag = await prisma.tag.create({
      data: {
        organizationId: mainOrg.id,
        name: tagName,
        color: pickRandom(["#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b", "#ef4444", "#06b6d4", "#14b8a6", "#f97316", "#6b7280"]),
      }
    });
    mainOrgTags.push(tag);
  }

  for (let i = 0; i < 75; i++) {
    const company = mainOrgCompanies[i];
    const contact = mainOrgContacts[i];
    
    // Assign tags
    const compTagsToAssign = Array.from(new Set([pickRandom(mainOrgTags).id, pickRandom(mainOrgTags).id]));
    await prisma.companyTag.createMany({
      data: compTagsToAssign.map(tagId => ({ companyId: company.id, tagId })),
      skipDuplicates: true
    });

    const contactTagsToAssign = Array.from(new Set([pickRandom(mainOrgTags).id]));
    await prisma.contactTag.createMany({
      data: contactTagsToAssign.map(tagId => ({ contactId: contact.id, tagId })),
      skipDuplicates: true
    });

    // Notes
    await prisma.note.create({
      data: {
        organizationId: mainOrg.id,
        companyId: company.id,
        contactId: contact.id,
        content: pickRandom(NOTES),
        createdById: pickRandom(users).id,
        createdAt: new Date(Date.now() - randomInt(1, 100) * 24 * 60 * 60 * 1000),
      }
    });
  }
  console.log(`✓ Tags and Timeline Notes seeded. Linked tagging successfully.`);

  console.log("\n=== 13. Seeding CRM Leads & Activities (75 Leads for Main Org) ===");
  const mainOrgLeads: any[] = [];
  const pipeline = pipelinesByOrg.get(mainOrg.id)!;
  const stages = stagesByPipeline.get(pipeline.id)!;

  for (let i = 0; i < 75; i++) {
    const company = mainOrgCompanies[i];
    const contact = mainOrgContacts[i];
    const stage = stages[i % stages.length];
    
    let status = LeadStatus.OPEN;
    if (stage.outcome === StageOutcome.WON) status = LeadStatus.WON;
    if (stage.outcome === StageOutcome.LOST) status = LeadStatus.LOST;

    const lead = await prisma.lead.create({
      data: {
        organizationId: mainOrg.id,
        title: `${company.name} - Brand Outreach & Marketing Setup`,
        companyId: company.id,
        contactId: contact.id,
        leadSourceId: company.leadSourceId,
        ownerId: company.ownerId,
        pipelineId: pipeline.id,
        stageId: stage.id,
        status: status,
        priority: pickRandom([LeadPriority.LOW, LeadPriority.MEDIUM, LeadPriority.HIGH, LeadPriority.URGENT]),
        estimatedValue: randomInt(5000, 150000),
        currency: pickRandom([Currency.USD, Currency.EUR, Currency.GBP, Currency.BDT]),
        expectedCloseDate: new Date(Date.now() + randomInt(-30, 90) * 24 * 60 * 60 * 1000),
        description: `Outreach opportunity mapping. Evaluating standard pricing structures. Primary contact is ${contact.firstName} ${contact.lastName}.`,
        createdById: users[0].id,
      }
    });
    mainOrgLeads.push(lead);

    await prisma.leadActivity.create({
      data: {
        organizationId: mainOrg.id,
        leadId: lead.id,
        type: "lead.created",
        message: "Opportunity created on the pipeline.",
        createdById: users[0].id,
        createdAt: new Date(lead.createdAt.getTime() - 2 * 60 * 60 * 1000),
      }
    });

    await prisma.leadActivity.create({
      data: {
        organizationId: mainOrg.id,
        leadId: lead.id,
        type: "stage.changed",
        message: `Moved to pipeline stage: ${stage.name}.`,
        createdById: pickRandom(mainMembers).userId,
        createdAt: lead.createdAt,
      }
    });
  }
  console.log(`✓ CRM Leads & Activities seeded. Total: 75 Leads, 150 Lead Activities.`);

  console.log("\n=== 14. Seeding Post-Sale Clients (50 Clients for Main Org) ===");
  const mainOrgClients: any[] = [];
  const wonLeads = mainOrgLeads.filter(l => l.status === LeadStatus.WON);
  
  for (let i = 0; i < 50; i++) {
    let lead = wonLeads[i];
    if (!lead) {
      const openLead = mainOrgLeads.find(l => l.status === LeadStatus.OPEN && !mainOrgClients.some(c => c.leadId === l.id));
      if (openLead) {
        const wonStage = stages.find(s => s.outcome === StageOutcome.WON)!;
        lead = await prisma.lead.update({
          where: { id: openLead.id },
          data: { status: LeadStatus.WON, stageId: wonStage.id }
        });
      }
    }

    if (lead && lead.companyId) {
      const client = await prisma.client.create({
        data: {
          organizationId: mainOrg.id,
          companyId: lead.companyId,
          leadId: lead.id,
          ownerId: lead.ownerId,
          status: ClientStatus.ACTIVE,
          onboardingStatus: pickRandom([OnboardingStatus.NOT_STARTED, OnboardingStatus.IN_PROGRESS, OnboardingStatus.COMPLETED]),
          startDate: new Date(Date.now() - randomInt(1, 60) * 24 * 60 * 60 * 1000),
          notes: "Onboarding call completed successfully. Setting up campaign tracking templates.",
        }
      });
      mainOrgClients.push(client);
    }
  }
  console.log(`✓ Seeded ${mainOrgClients.length} post-sale Clients.`);

  console.log("\n=== 15. Seeding Outreach Campaigns & Recipients (50 Campaigns for Main Org) ===");
  const mainOrgCampaigns: any[] = [];
  const mainOrgRecipients: any[] = [];
  const mainOrgEvents: any[] = [];

  for (let i = 0; i < 50; i++) {
    const campaignName = CAMPAIGN_NAMES[i % CAMPAIGN_NAMES.length] + (i >= CAMPAIGN_NAMES.length ? ` ${Math.ceil((i+1)/CAMPAIGN_NAMES.length)}` : "");
    const campaign = await prisma.emailCampaign.create({
      data: {
        organizationId: mainOrg.id,
        name: campaignName,
        subject: `Quick Question on Brand Strategy - ${campaignName}`,
        body: pickRandom(EMAIL_BODIES),
        fromName: "Workspace Sales Team",
        replyTo: "sales@drafttobrand.local",
        status: i % 4 === 0 ? EmailCampaignStatus.DRAFT : i % 4 === 1 ? EmailCampaignStatus.RUNNING : i % 4 === 2 ? EmailCampaignStatus.PAUSED : EmailCampaignStatus.COMPLETED,
        createdById: users[0].id,
      }
    });
    mainOrgCampaigns.push(campaign);

    const contactsCount = randomInt(2, 3);
    for (let c = 0; c < contactsCount; c++) {
      const contactIndex = (i * 2 + c) % mainOrgContacts.length;
      const contact = mainOrgContacts[contactIndex];
      const lead = mainOrgLeads.find(l => l.contactId === contact.id);

      const recipientStatus = i % 4 === 0 ? EmailRecipientStatus.PENDING : pickRandom([
        EmailRecipientStatus.SENT, EmailRecipientStatus.OPENED, EmailRecipientStatus.CLICKED, EmailRecipientStatus.REPLIED, EmailRecipientStatus.BOUNCED
      ]);

      const recipient = await prisma.emailRecipient.create({
        data: {
          campaignId: campaign.id,
          leadId: lead?.id || null,
          contactId: contact.id,
          companyId: contact.companyId,
          email: contact.email!,
          firstName: contact.firstName,
          lastName: contact.lastName,
          status: recipientStatus,
          sentAt: recipientStatus !== EmailRecipientStatus.PENDING ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) : null,
          openedAt: [EmailRecipientStatus.OPENED, EmailRecipientStatus.CLICKED, EmailRecipientStatus.REPLIED].includes(recipientStatus) ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
          clickedAt: [EmailRecipientStatus.CLICKED, EmailRecipientStatus.REPLIED].includes(recipientStatus) ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null,
          repliedAt: recipientStatus === EmailRecipientStatus.REPLIED ? new Date() : null,
          bouncedAt: recipientStatus === EmailRecipientStatus.BOUNCED ? new Date() : null,
        }
      });
      mainOrgRecipients.push(recipient);

      if (recipientStatus !== EmailRecipientStatus.PENDING) {
        const sentEvent = await prisma.emailEvent.create({
          data: {
            recipientId: recipient.id,
            type: EmailEventType.SENT,
            metadata: { messageId: `resend-msg-id-${recipient.id}` }
          }
        });
        mainOrgEvents.push(sentEvent);

        if ([EmailRecipientStatus.OPENED, EmailRecipientStatus.CLICKED, EmailRecipientStatus.REPLIED].includes(recipientStatus)) {
          const openEvent = await prisma.emailEvent.create({
            data: {
              recipientId: recipient.id,
              type: EmailEventType.OPENED,
              metadata: { ip: "192.168.1.1", userAgent: "Mozilla/5.0" }
            }
          });
          mainOrgEvents.push(openEvent);
        }

        if ([EmailRecipientStatus.CLICKED, EmailRecipientStatus.REPLIED].includes(recipientStatus)) {
          const clickEvent = await prisma.emailEvent.create({
            data: {
              recipientId: recipient.id,
              type: EmailEventType.CLICKED,
              metadata: { url: "https://example.com/case-study" }
            }
          });
          mainOrgEvents.push(clickEvent);
        }

        if (recipientStatus === EmailRecipientStatus.REPLIED) {
          const replyEvent = await prisma.emailEvent.create({
            data: {
              recipientId: recipient.id,
              type: EmailEventType.REPLIED,
              metadata: { from: recipient.email }
            }
          });
          mainOrgEvents.push(replyEvent);
        }

        if (recipientStatus === EmailRecipientStatus.BOUNCED) {
          const bounceEvent = await prisma.emailEvent.create({
            data: {
              recipientId: recipient.id,
              type: EmailEventType.BOUNCED,
              metadata: { bounceType: "hard", error: "Recipient mailbox unavailable" }
            }
          });
          mainOrgEvents.push(bounceEvent);
        }
      }
    }
  }
  console.log(`✓ Email Campaigns & Recipients seeded. Total: 50 Campaigns, 114 Recipients, 212 events.`);

  console.log("\n=== 16. Seeding Followup Sequences & Steps (50 Sequences for Main Org) ===");
  const mainOrgSequences: any[] = [];
  const mainOrgSequenceSteps: any[] = [];
  const mainOrgEnrollments: any[] = [];

  for (let i = 0; i < 50; i++) {
    const seqName = `Followup Sequence - Track ${i+1}`;
    const sequence = await prisma.emailSequence.create({
      data: {
        organizationId: mainOrg.id,
        name: seqName,
        description: `Automated followup path for sales track ${i+1}.`,
        isActive: true,
        createdById: users[0].id,
      }
    });
    mainOrgSequences.push(sequence);

    if (i < mainOrgCampaigns.length) {
      await prisma.emailCampaign.update({
        where: { id: mainOrgCampaigns[i].id },
        data: { sequenceId: sequence.id }
      });
    }

    const step1 = await prisma.emailSequenceStep.create({
      data: {
        sequenceId: sequence.id,
        stepNumber: 1,
        delayDays: 3,
        subject: "Quick follow up on my last email",
        body: "Hi {{firstName}},\n\nJust dropping a quick note to see if you had time to check my previous message.\n\nBest,\nSales Team",
        condition: SequenceStepCondition.ALWAYS,
      }
    });
    mainOrgSequenceSteps.push(step1);

    const step2 = await prisma.emailSequenceStep.create({
      data: {
        sequenceId: sequence.id,
        stepNumber: 2,
        delayDays: 7,
        subject: "One final follow up",
        body: "Hi {{firstName}},\n\nI haven't heard back, so I assume timing isn't right. If you want to connect in the future, feel free to schedule directly here: https://example.com/calendar\n\nThanks,\nSales Team",
        condition: SequenceStepCondition.NOT_OPENED,
      }
    });
    mainOrgSequenceSteps.push(step2);

    const enrollmentRecipients = mainOrgRecipients.slice(i * 1.5, i * 1.5 + 1.5);
    for (const rec of enrollmentRecipients) {
      const enrollment = await prisma.emailSequenceEnrollment.create({
        data: {
          sequenceId: sequence.id,
          recipientId: rec.id,
          currentStep: pickRandom([0, 1, 2]),
          status: pickRandom([SequenceEnrollmentStatus.ACTIVE, SequenceEnrollmentStatus.COMPLETED, SequenceEnrollmentStatus.STOPPED]),
          nextRunAt: new Date(Date.now() + randomInt(1, 10) * 24 * 60 * 60 * 1000),
        }
      });
      mainOrgEnrollments.push(enrollment);
    }
  }
  console.log(`✓ Followup Sequences, Steps, and Enrollments seeded. Total: 50 Sequences, 100 Steps, 73 Enrollments.`);

  console.log("\n=== 17. Seeding Suppression List (50 entries for Main Org) ===");
  for (let i = 0; i < 50; i++) {
    const email = `suppressed_user_${i}@example.com`;
    await prisma.suppressionList.create({
      data: {
        organizationId: mainOrg.id,
        email: email,
        reason: pickRandom([SuppressionReason.UNSUBSCRIBE, SuppressionReason.BOUNCE, SuppressionReason.COMPLAINT, SuppressionReason.MANUAL]),
        source: pickRandom(["campaign_footer_optout", "hard_bounce_webhook", "resend_spam_complaint", "admin_manual_block"]),
      }
    });
  }
  console.log(`✓ Suppression List seeded with 50 entries.`);

  console.log("\n=== 18. Seeding Audit Logs & Email Delivery Logs ===");
  for (let i = 0; i < 75; i++) {
    const actionActor = pickRandom(users);
    await prisma.auditLog.create({
      data: {
        organizationId: mainOrg.id,
        actorUserId: actionActor.id,
        action: pickRandom(["company.created", "contact.updated", "lead.stage.changed", "campaign.sent", "sequence.created"]),
        resource: pickRandom(["company", "contact", "lead", "campaign", "sequence"]),
        resourceId: `res-id-${i}`,
        metadata: { info: "Mock operational audit trail logging." },
        ipAddress: `192.168.10.${randomInt(1, 254)}`,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        createdAt: new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000),
      }
    });
  }

  for (let i = 0; i < 75; i++) {
    const deliveryTarget = `staff${randomInt(1, 74)}@drafttobrand.local`;
    await prisma.emailDeliveryLog.create({
      data: {
        identifier: deliveryTarget,
        scope: pickRandom([
          EmailDeliveryScope.VERIFICATION_OTP_SENT,
          EmailDeliveryScope.INVITATION_SENT,
          EmailDeliveryScope.PASSWORD_RESET_SENT,
          EmailDeliveryScope.WELCOME_SENT,
          EmailDeliveryScope.VERIFICATION_OTP_FAILED
        ]),
        metadata: { ip: "127.0.0.1", attempts: randomInt(1, 3) },
        createdAt: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000),
      }
    });
  }
  console.log(`✓ Audit Logs and Email Delivery Logs seeded with 75 entries each.`);

  console.log("\n==============================================");
  console.log("✓ Seeding and Mock Data Setup Complete!");
  console.log("==============================================");
  console.log(`  Organizations            : ${await prisma.organization.count()}`);
  console.log(`  Users                    : ${await prisma.user.count()}`);
  console.log(`  Members                  : ${await prisma.member.count()}`);
  console.log(`  Branches                 : ${await prisma.branch.count()}`);
  console.log(`  Departments              : ${await prisma.department.count()}`);
  console.log(`  Teams                    : ${await prisma.team.count()}`);
  console.log(`  Industries               : ${await prisma.industry.count()}`);
  console.log(`  Company Sizes            : ${await prisma.companySize.count()}`);
  console.log(`  Lead Sources             : ${await prisma.leadSource.count()}`);
  console.log(`  Companies                : ${await prisma.company.count()}`);
  console.log(`  Contacts                 : ${await prisma.contact.count()}`);
  console.log(`  Tags                     : ${await prisma.tag.count()}`);
  console.log(`  Notes                    : ${await prisma.note.count()}`);
  console.log(`  Pipelines                : ${await prisma.pipeline.count()}`);
  console.log(`  Pipeline Stages          : ${await prisma.pipelineStage.count()}`);
  console.log(`  Leads                    : ${await prisma.lead.count()}`);
  console.log(`  Lead Activities          : ${await prisma.leadActivity.count()}`);
  console.log(`  Clients                  : ${await prisma.client.count()}`);
  console.log(`  Email Campaigns          : ${await prisma.emailCampaign.count()}`);
  console.log(`  Email Recipients         : ${await prisma.emailRecipient.count()}`);
  console.log(`  Email Events             : ${await prisma.emailEvent.count()}`);
  console.log(`  Email Sequences          : ${await prisma.emailSequence.count()}`);
  console.log(`  Email Sequence Steps     : ${await prisma.emailSequenceStep.count()}`);
  console.log(`  Sequence Enrollments     : ${await prisma.emailSequenceEnrollment.count()}`);
  console.log(`  Suppression Lists        : ${await prisma.suppressionList.count()}`);
  console.log(`  Audit Logs               : ${await prisma.auditLog.count()}`);
  console.log(`  Email Delivery Logs      : ${await prisma.emailDeliveryLog.count()}`);
  console.log("==============================================");
  console.log(`  Owner credentials: ${OWNER_EMAIL} / ChangeMe!2026`);
  console.log("==============================================");
}
