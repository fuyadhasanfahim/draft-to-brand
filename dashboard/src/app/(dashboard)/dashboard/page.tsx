import { getServerSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui";

export const metadata = { title: "Overview" };

export default async function DashboardOverviewPage() {
  const session = await getServerSession();
  if (!session) return null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Badge variant="primary">Phase 0 · Foundation</Badge>
        <h1 className="text-display text-3xl">
          Welcome back, {session.user.name.split(" ")[0]}.
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] max-w-2xl">
          You&rsquo;re signed in to <span className="font-medium text-[var(--color-foreground)]">{session.member.organization.name}</span> as{" "}
          <span className="font-medium text-[var(--color-foreground)]">{session.member.role.name}</span>.
          Future modules — CRM, Projects, HR, Invoicing — will appear here as they
          come online.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Branches",    value: "—" },
          { label: "Departments", value: "—" },
          { label: "Teams",       value: "—" },
          { label: "Members",     value: "—" },
        ].map((s) => (
          <div key={s.label} className="surface-card p-5">
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
