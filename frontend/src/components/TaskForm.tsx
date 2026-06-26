"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { CreateTaskInput, Priority, priorityLabels } from "@/lib/types";
import { DateTimePicker } from "@/components/DateTimePicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface TaskFormProps {
  onCreate: (input: CreateTaskInput) => Promise<void>;
}

const priorityOptions = [Priority.Low, Priority.Medium, Priority.High];

export default function TaskForm({ onCreate }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>(Priority.Medium);
  const [due, setDue] = useState<string | null>(null);
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
        dueDate: due,
      });
      // Success — clear the form for the next entry.
      setTitle("");
      setDescription("");
      setPriority(Priority.Medium);
      setDue(null);
    } catch (err) {
      // Keep the user's input; just surface the error.
      setError(err instanceof ApiError ? err.message : "Could not add task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            aria-label="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs doing?"
          />
          <Textarea
            aria-label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
          />
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

            <Button type="submit" disabled={submitting} className="ml-auto">
              {submitting ? "Adding…" : "Add task"}
            </Button>
          </div>
          {error && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
