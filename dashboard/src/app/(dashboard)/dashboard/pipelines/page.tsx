import { permanentRedirect } from "next/navigation";

/**
 * Pipelines moved under Settings in Phase 2C. Permanent redirect so old
 * bookmarks and sidebar collapses keep working.
 */
export default function PipelinesLegacyRedirect() {
  permanentRedirect("/dashboard/settings/pipelines");
}
