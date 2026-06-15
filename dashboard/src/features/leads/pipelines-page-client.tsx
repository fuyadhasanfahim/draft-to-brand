"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconArchive,
  IconArchiveOff,
  IconDots,
  IconEdit,
  IconGripVertical,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import {
  Badge,
  Button,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  EmptyState,
  useToast,
} from "@/components/ui";
import {
  archivePipelineAction,
  deletePipelineStageAction,
  reorderPipelineStagesAction,
} from "@/actions/pipelines";
import {
  PipelineFormDialog,
  type PipelineEditable,
} from "./pipeline-form-dialog";
import {
  StageFormDialog,
  type StageEditable,
} from "./stage-form-dialog";

export type PipelineWithStagesAndCounts = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isDefault: boolean;
  archivedAt: Date | null;
  leadCount: number;
  stages: (StageEditable & { leadCount: number })[];
};

export function PipelinesPageClient({
  pipelines,
  canManage,
}: {
  pipelines: PipelineWithStagesAndCounts[];
  canManage: boolean;
}) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingPipeline, setEditingPipeline] = React.useState<PipelineEditable | null>(null);
  const [stageDialog, setStageDialog] = React.useState<
    | { mode: "create"; pipelineId: string }
    | { mode: "edit"; stage: StageEditable }
    | null
  >(null);

  return (
    <>
      <div className="mb-4 flex justify-end">
        {canManage ? (
          <Button variant="accent" onClick={() => setCreateOpen(true)}>
            <IconPlus size={15} /> New pipeline
          </Button>
        ) : null}
      </div>

      {pipelines.length === 0 ? (
        <EmptyState
          title="No pipelines yet"
          description="Create one to start moving leads through stages."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {pipelines.map((p) => (
            <PipelineCard
              key={p.id}
              pipeline={p}
              canManage={canManage}
              onEditPipeline={() =>
                setEditingPipeline({
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  description: p.description,
                  isDefault: p.isDefault,
                })
              }
              onAddStage={() => setStageDialog({ mode: "create", pipelineId: p.id })}
              onEditStage={(stage) => setStageDialog({ mode: "edit", stage })}
            />
          ))}
        </div>
      )}

      {canManage ? (
        <PipelineFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      ) : null}
      {editingPipeline ? (
        <PipelineFormDialog
          open={!!editingPipeline}
          onOpenChange={(v) => !v && setEditingPipeline(null)}
          pipeline={editingPipeline}
        />
      ) : null}
      {stageDialog ? (
        <StageFormDialog
          open
          onOpenChange={(v) => !v && setStageDialog(null)}
          pipelineId={
            stageDialog.mode === "edit" ? stageDialog.stage.pipelineId : stageDialog.pipelineId
          }
          stage={stageDialog.mode === "edit" ? stageDialog.stage : undefined}
        />
      ) : null}
    </>
  );
}

function PipelineCard({
  pipeline,
  canManage,
  onEditPipeline,
  onAddStage,
  onEditStage,
}: {
  pipeline: PipelineWithStagesAndCounts;
  canManage: boolean;
  onEditPipeline: () => void;
  onAddStage: () => void;
  onEditStage: (stage: StageEditable) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [stages, setStages] = React.useState(pipeline.stages);

  React.useEffect(() => {
    setStages(pipeline.stages);
  }, [pipeline.stages]);

  const dragIndex = React.useRef<number | null>(null);

  const handleDragStart = (index: number) => () => {
    dragIndex.current = index;
  };
  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === index) return;
    setStages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      dragIndex.current = index;
      return next;
    });
  };
  const handleDragEnd = async () => {
    dragIndex.current = null;
    if (!canManage) return;
    const ids = stages.map((s) => s.id);
    const original = pipeline.stages.map((s) => s.id).join(",");
    if (ids.join(",") === original) return;
    const res = await reorderPipelineStagesAction({
      pipelineId: pipeline.id,
      stageIds: ids,
    });
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't reorder", description: res.error });
      setStages(pipeline.stages);
      return;
    }
    router.refresh();
  };

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <header className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between border-b border-[var(--color-border)]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[15px] font-semibold text-[var(--color-foreground)]">
              {pipeline.name}
            </h2>
            {pipeline.isDefault ? <Badge variant="primary">Default</Badge> : null}
            {pipeline.archivedAt ? <Badge variant="neutral">Archived</Badge> : null}
            <Badge variant="neutral">
              {pipeline.leadCount} lead{pipeline.leadCount === 1 ? "" : "s"}
            </Badge>
          </div>
          {pipeline.description ? (
            <p className="mt-1 text-[12px] text-[var(--color-muted-foreground)]">
              {pipeline.description}
            </p>
          ) : null}
        </div>
        {canManage ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onAddStage}>
              <IconPlus size={14} /> Add stage
            </Button>
            <Dropdown>
              <DropdownTrigger>
                <Button variant="ghost" size="icon-sm" aria-label="Actions">
                  <IconDots size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownContent>
                <DropdownItem onSelect={onEditPipeline}>
                  <IconEdit size={14} /> Edit
                </DropdownItem>
                <DropdownItem
                  onSelect={async () => {
                    const res = await archivePipelineAction(pipeline.id);
                    if (!res.ok) {
                      toast({ variant: "error", title: "Action failed", description: res.error });
                      return;
                    }
                    router.refresh();
                  }}
                >
                  {pipeline.archivedAt ? (
                    <>
                      <IconArchiveOff size={14} /> Restore
                    </>
                  ) : (
                    <>
                      <IconArchive size={14} /> Archive
                    </>
                  )}
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        ) : null}
      </header>

      {stages.length === 0 ? (
        <div className="p-6 text-center text-[12px] text-[var(--color-muted)]">
          No stages yet. {canManage ? "Add the first one." : ""}
        </div>
      ) : (
        <ul className="flex flex-col">
          {stages.map((s, index) => (
            <li
              key={s.id}
              draggable={canManage}
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver(index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => e.preventDefault()}
              className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-background)] transition-colors"
            >
              {canManage ? (
                <span
                  className="cursor-grab active:cursor-grabbing text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  aria-label="Drag to reorder"
                >
                  <IconGripVertical size={14} />
                </span>
              ) : (
                <span className="w-3.5" />
              )}
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <div className="flex flex-col leading-tight min-w-0 flex-1">
                <span className="text-[13px] font-medium text-[var(--color-foreground)] truncate">
                  {s.name}
                </span>
                <span className="text-[11px] text-[var(--color-muted)]">
                  Win probability {s.winProbability}% · {s.leadCount} lead
                  {s.leadCount === 1 ? "" : "s"}
                </span>
              </div>
              {canManage ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEditStage(s)}
                    aria-label="Edit stage"
                  >
                    <IconEdit size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete stage"
                    onClick={async () => {
                      if (s.leadCount > 0) {
                        toast({
                          variant: "error",
                          title: "Can't delete",
                          description: "Move leads off this stage first.",
                        });
                        return;
                      }
                      const res = await deletePipelineStageAction(s.id);
                      if (!res.ok) {
                        toast({
                          variant: "error",
                          title: "Action failed",
                          description: res.error,
                        });
                        return;
                      }
                      router.refresh();
                    }}
                  >
                    <IconTrash size={14} />
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
