"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { localInputToUtcIso, utcIsoToLocalInput } from "@/lib/format";
import { Priority, priorityLabels, Task, UpdateTaskInput } from "@/lib/types";

interface EditTaskDialogProps {
  task: Task;
  onSave: (id: string, input: UpdateTaskInput) => Promise<void>;
  onClose: () => void;
}

export default function EditTaskDialog({ task, onSave, onClose }: EditTaskDialogProps) {
  // Pre-populate every field with the task's current values.
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [due, setDue] = useState(utcIsoToLocalInput(task.dueDate));
  const [isCompleted, setIsCompleted] = useState(task.isCompleted);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        dueDate: localInputToUtcIso(due),
        isCompleted,
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save changes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Edit task"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900">Edit task</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            aria-label="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />
          <textarea
            aria-label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Notes (optional)"
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-600">
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value) as Priority)}
                className="ml-2 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-900"
              >
                {Object.values(Priority)
                  .filter((v): v is Priority => typeof v === "number")
                  .map((p) => (
                    <option key={p} value={p}>
                      {priorityLabels[p]}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Due
              <input
                type="datetime-local"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="ml-2 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-900"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Completed
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
