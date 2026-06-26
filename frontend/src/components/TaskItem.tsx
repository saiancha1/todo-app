"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusSelect } from "@/components/StatusSelect";
import { formatDueDate, isOverdue } from "@/lib/format";
import { Priority, priorityLabels, Status, Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TaskItemProps {
  task: Task;
  onSetStatus: (task: Task, status: Status) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
  onEdit: (task: Task) => void;
}

const priorityVariant: Record<Priority, "secondary" | "default" | "destructive"> = {
  [Priority.Low]: "secondary",
  [Priority.Medium]: "default",
  [Priority.High]: "destructive",
};

export default function TaskItem({ task, onSetStatus, onDelete, onEdit }: TaskItemProps) {
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>, failureMessage: string) {
    setBusy(true);
    try {
      await action();
    } catch {
      toast.error(failureMessage);
    } finally {
      setBusy(false);
    }
  }

  const due = formatDueDate(task.dueDate);
  const done = task.status === Status.Done;
  const overdue = !done && isOverdue(task.dueDate);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <StatusSelect
          value={task.status}
          disabled={busy}
          onChange={(s) => run(() => onSetStatus(task, s), "Could not update the task.")}
          className="w-[130px] shrink-0"
        />

        <div className="min-w-0 flex-1">
          <p className={`break-words font-medium ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
            {task.title}
          </p>
          {task.description && (
            <p className={`mt-0.5 break-words text-sm ${done ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
              {task.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={priorityVariant[task.priority]}>{priorityLabels[task.priority]}</Badge>
            {due && (
              <span className={`text-xs ${overdue ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                {overdue ? "Overdue · " : "Due "}
                {due}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(task)} aria-label="Edit task">
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={busy}
            onClick={() => run(() => onDelete(task), "Could not delete the task.")}
            aria-label="Delete task"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
