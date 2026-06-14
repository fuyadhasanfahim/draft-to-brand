import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { ContactsPageClient } from "@/features/crm/contacts-page-client";

export const metadata = { title: "Contacts" };

export default async function ContactsPage() {
  const session = await requireSession();
  if (!(await can("contacts.view"))) notFound();

  const orgId = session.member.organizationId;
  const [contacts, companies, tags, canManage, canManageTags] = await Promise.all([
    prisma.contact.findMany({
      where: { organizationId: orgId },
      include: {
        company: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
      },
      orderBy: [{ archivedAt: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.company.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.tag.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
    can("contacts.manage"),
    can("tags.manage"),
  ]);

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="People — independent or attached to a company. Notes and (later) outreach attach here."
      />
      <ContactsPageClient
        contacts={contacts}
        companies={companies}
        tags={tags}
        canManage={canManage}
        canManageTags={canManageTags}
      />
    </div>
  );
}
