import { permanentRedirect } from "next/navigation";

/**
 * Legacy URL. Users who landed here under the old "dead-end" flow are
 * sent through self-service onboarding instead.
 */
export default function NoWorkspaceRedirect() {
  permanentRedirect("/onboarding");
}
