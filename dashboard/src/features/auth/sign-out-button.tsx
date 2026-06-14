"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui";

export function SignOutButton({
  children = "Sign out",
  variant = "secondary",
}: {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const router = useRouter();
  return (
    <Button
      variant={variant}
      onClick={async () => {
        await authClient.signOut();
        router.push("/sign-in");
        router.refresh();
      }}
    >
      {children}
    </Button>
  );
}
