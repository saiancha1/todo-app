"use client";

import { useState } from "react";
import { formatDueDate, isOverdue } from "@/lib/format";
import { Priority, priorityLabels, Task } from "@/lib/types";

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
  onEdit: (task: Task) => void;
}

const priorityStyles: Record<Priority, string> = {
  [Priority.Low]: "bg-slate-100 text-slate-600",
  [Priority.Medium]: "bg-blue-100 text-blue-700",
  [Priority.High]: "bg-red-100 text-red-700",
};

export default function TaskItem({ task, onToggle, onDelete, onEdit }: TaskItemProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch {
      setError("Action failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const due = formatDueDate(task.dueDate);
  const overdue = !task.isCompleted && isOverdue(task.dueDate);

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.isCompleted}
          disabled={busy}
          onChange={() => run(() => onToggle(task))}
          aria-label={task.isCompleted ? "Mark as not done" : "Mark as done"}
          className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300"
        />

        <div className="min-w-0 flex-1">
          <p
            className={`break-words font-medium ${
              task.isCompleted ? "text-slate-400 line-through" : "text-slate-900"
            }`}
          >
            {task.title}
          </p>
          {task.description && (
            <p className={`mt-0.5 break-words text-sm ${task.isCompleted ? "text-slate-300" : "text-slate-500"}`}>
              {task.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyles[task.priority]}`}>
              {priorityLabels[task.priority]}
            </span>
            {due && (
              <span className={`text-xs ${overdue ? "font-medium text-red-600" : "text-slate-500"}`}>
                {overdue ? "Overdue · " : "Due "}
                {due}
              </span>
            )}
          </div>
          {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => onDelete(task))}
            className="rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
