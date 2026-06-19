import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { NewSequencePageClient } from "@/features/sequences/new-sequence-page-client";

export const metadata = { title: "New sequence" };
export const dynamic = "force-dynamic";

export default async function NewSequencePage() {
  await requireSession();
  if (!(await can("sequences.view"))) notFound();
  if (!(await can("sequences.create")) && !(await can("sequences.manage"))) notFound();

  return <NewSequencePageClient />;
}
