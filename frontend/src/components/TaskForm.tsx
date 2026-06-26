"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { localInputToUtcIso } from "@/lib/format";
import { CreateTaskInput, Priority, priorityLabels } from "@/lib/types";

interface TaskFormProps {
  onCreate: (input: CreateTaskInput) => Promise<void>;
}

export default function TaskForm({ onCreate }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>(Priority.Medium);
  const [due, setDue] = useState("");
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
      await onCreate({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        dueDate: localInputToUtcIso(due),
      });
      // Success — clear the form for the next entry.
      setTitle("");
      setDescription("");
      setPriority(Priority.Medium);
      setDue("");
    } catch (err) {
      // Keep the user's input; just surface the error.
      setError(err instanceof ApiError ? err.message : "Could not add task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <input
          aria-label="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
        />
        <textarea
          aria-label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
        />
        <div className="flex flex-wrap items-end gap-3">
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
          <button
            type="submit"
            disabled={submitting}
            className="ml-auto rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add task"}
          </button>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
