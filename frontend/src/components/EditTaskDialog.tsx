"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { Priority, priorityLabels, Status, Task, UpdateTaskInput } from "@/lib/types";
import { DateTimePicker } from "@/components/DateTimePicker";
import { StatusSelect } from "@/components/StatusSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface EditTaskDialogProps {
  task: Task;
  onSave: (id: string, input: UpdateTaskInput) => Promise<void>;
  onClose: () => void;
}

const priorityOptions = [Priority.Low, Priority.Medium, Priority.High];

export default function EditTaskDialog({ task, onSave, onClose }: EditTaskDialogProps) {
  // Pre-populate every field with the task's current values.
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [due, setDue] = useState<string | null>(task.dueDate);
  const [status, setStatus] = useState<Status>(task.status);
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
        dueDate: due,
        status,
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save changes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              aria-label="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea
              id="edit-desc"
              aria-label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Notes (optional)"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={String(priority)} onValueChange={(v) => setPriority(Number(v) as Priority)}>
              <SelectTrigger className="w-[140px]" aria-label="Priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {priorityLabels[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateTimePicker value={due} onChange={setDue} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <StatusSelect value={status} onChange={setStatus} className="w-[160px]" />
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
