"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDueDate, isOverdue } from "@/lib/format";
import { Priority, priorityLabels, Status, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface TaskCardActions {
  onDelete: (task: Task) => Promise<void>;
  onEdit: (task: Task) => void;
}

const priorityVariant: Record<Priority, "secondary" | "default" | "destructive"> = {
  [Priority.Low]: "secondary",
  [Priority.Medium]: "default",
  [Priority.High]: "destructive",
};

/** Presentational card — used both in a column and inside the drag overlay. */
export function TaskCardContent({
  task,
  onDelete,
  onEdit,
  dragging,
}: { task: Task; dragging?: boolean } & TaskCardActions) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(task);
    } catch {
      toast.error("Could not delete the task.");
    } finally {
      setBusy(false);
    }
  }

  const due = formatDueDate(task.dueDate);
  const done = task.status === Status.Done;
  const overdue = !done && isOverdue(task.dueDate);
  // Stop pointer events on interactive controls from starting a drag.
  const noDrag = { onPointerDown: (e: React.PointerEvent) => e.stopPropagation() };

  return (
    <Card className={cn("gap-0 p-3 shadow-sm", dragging && "ring-2 ring-ring")}>
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={cn("break-words text-sm font-medium", done ? "text-muted-foreground line-through" : "text-foreground")}>
            {task.title}
          </p>
          {task.description && (
            <p className="mt-0.5 line-clamp-2 break-words text-xs text-muted-foreground">
              {task.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={priorityVariant[task.priority]}>{priorityLabels[task.priority]}</Badge>
            {due && (
              <span className={cn("text-xs", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
                {overdue ? "Overdue · " : "Due "}
                {due}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => onEdit(task)} aria-label="Edit task" {...noDrag}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive"
            disabled={busy}
            onClick={handleDelete}
            aria-label="Delete task"
            {...noDrag}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** Draggable wrapper around the presentational card. */
export default function TaskCard(props: { task: Task } & TaskCardActions) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.task.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("cursor-grab touch-none outline-none", isDragging && "opacity-40")}
    >
      <TaskCardContent {...props} />
    </div>
  );
}
