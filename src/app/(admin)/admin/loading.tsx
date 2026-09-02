import { IconLoader2 } from "@tabler/icons-react";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <IconLoader2 className="animate-spin text-muted" size={24} />
    </div>
  );
}
