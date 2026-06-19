/**
 * Sequence step condition engine (Phase 3).
 *
 * Pure + dependency-free so it can be unit-reasoned and shared by the scheduler
 * and (later) any preview/dry-run UI. Evaluates a step's gate against a
 * recipient's tracking state.
 */

export type StepCondition =
  | "ALWAYS"
  | "NOT_OPENED"
  | "OPENED_NOT_CLICKED"
  | "CLICKED_NOT_REPLIED";

export type RecipientConditionState = {
  openedAt: Date | null;
  clickedAt: Date | null;
  repliedAt: Date | null;
};

/** True when the step's followup should be sent for this recipient. */
export function conditionPasses(
  condition: StepCondition,
  r: RecipientConditionState
): boolean {
  switch (condition) {
    case "ALWAYS":
      return true;
    case "NOT_OPENED":
      return r.openedAt === null;
    case "OPENED_NOT_CLICKED":
      return r.openedAt !== null && r.clickedAt === null;
    case "CLICKED_NOT_REPLIED":
      return r.clickedAt !== null && r.repliedAt === null;
    default:
      return false;
  }
}

/** Human-readable labels for UI (sequence step editor + detail page). */
export const CONDITION_LABELS: Record<StepCondition, string> = {
  ALWAYS: "Always send",
  NOT_OPENED: "Only if not opened",
  OPENED_NOT_CLICKED: "Opened but not clicked",
  CLICKED_NOT_REPLIED: "Clicked but not replied",
};
