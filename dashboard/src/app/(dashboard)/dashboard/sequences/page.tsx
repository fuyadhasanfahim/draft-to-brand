import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import {
  SequencesPageClient,
  type SequenceRow,
} from "@/features/sequences/sequences-page-client";

export const metadata = { title: "Sequences" };
export const dynamic = "force-dynamic";

export default async function SequencesPage() {
  const session = await requireSession();
  if (!(await can("sequences.view"))) notFound();
  const orgId = session.member.organizationId;

  const [sequences, canCreate, canEdit, canDelete, canManage] = await Promise.all([
    prisma.emailSequence.findMany({
      where: { organizationId: orgId },
      include: { _count: { select: { steps: true, enrollments: true } } },
      orderBy: [{ archivedAt: "asc" }, { createdAt: "desc" }],
    }),
    can("sequences.create"),
    can("sequences.edit"),
    can("sequences.delete"),
    can("sequences.manage"),
  ]);

  const rows: SequenceRow[] = sequences.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    isActive: s.isActive,
    archivedAt: s.archivedAt,
    createdAt: s.createdAt,
    stepCount: s._count.steps,
    enrollmentCount: s._count.enrollments,
  }));

  return (
    <div>
      <PageHeader
        title="Sequences"
        description="Automated followup sequences. Define timed steps with conditions, then attach a sequence to a campaign — recipients are enrolled on send."
      />
      <SequencesPageClient
        sequences={rows}
        canCreate={canCreate || canManage}
        canEdit={canEdit || canManage}
        canDelete={canDelete || canManage}
      />
    </div>
  );
}
