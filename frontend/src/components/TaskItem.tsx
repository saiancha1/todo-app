"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDueDate, isOverdue } from "@/lib/format";
import { Priority, priorityLabels, Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
  onEdit: (task: Task) => void;
}

const priorityVariant: Record<Priority, "secondary" | "default" | "destructive"> = {
  [Priority.Low]: "secondary",
  [Priority.Medium]: "default",
  [Priority.High]: "destructive",
};

export default function TaskItem({ task, onToggle, onDelete, onEdit }: TaskItemProps) {
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
  const overdue = !task.isCompleted && isOverdue(task.dueDate);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.isCompleted}
          disabled={busy}
          onCheckedChange={() => run(() => onToggle(task), "Could not update the task.")}
          aria-label={task.isCompleted ? "Mark as not done" : "Mark as done"}
          className="mt-1"
        />

        <div className="min-w-0 flex-1">
          <p
            className={`break-words font-medium ${
              task.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
            }`}
          >
            {task.title}
          </p>
          {task.description && (
            <p className={`mt-0.5 break-words text-sm ${task.isCompleted ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
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
