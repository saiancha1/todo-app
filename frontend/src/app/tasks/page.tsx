"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditTaskDialog from "@/components/EditTaskDialog";
import TaskForm from "@/components/TaskForm";
import TaskItem from "@/components/TaskItem";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { CreateTaskInput, Task, TaskFilter, UpdateTaskInput } from "@/lib/types";

const filters: { key: TaskFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

export default function TasksPage() {
  const router = useRouter();
  const { email, isAuthenticated, initializing, logout } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);

  // Redirect unauthenticated users once auth state has rehydrated.
  useEffect(() => {
    if (!initializing && !isAuthenticated) router.replace("/login");
  }, [initializing, isAuthenticated, router]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTasks(await api.listTasks(filter));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        router.replace("/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, [filter, logout, router]);

  useEffect(() => {
    if (isAuthenticated) loadTasks();
  }, [isAuthenticated, loadTasks]);

  // --- Mutations: update local state immediately, no full-page refresh. ---

  const handleCreate = useCallback(
    async (input: CreateTaskInput) => {
      const created = await api.createTask(input);
      // Respect the current filter: a new task is active, so hide it under "completed".
      if (filter !== "completed") setTasks((prev) => [created, ...prev]);
    },
    [filter],
  );

  const handleToggle = useCallback(
    async (task: Task) => {
      const updated = await api.toggleTask(task.id);
      setTasks((prev) =>
        prev
          .map((t) => (t.id === updated.id ? updated : t))
          // Drop it from the list if it no longer matches the active filter.
          .filter((t) =>
            filter === "active" ? !t.isCompleted : filter === "completed" ? t.isCompleted : true,
          ),
      );
    },
    [filter],
  );

  const handleUpdate = useCallback(
    async (id: string, input: UpdateTaskInput) => {
      const updated = await api.updateTask(id, input);
      setTasks((prev) =>
        prev
          .map((t) => (t.id === updated.id ? updated : t))
          .filter((t) =>
            filter === "active" ? !t.isCompleted : filter === "completed" ? t.isCompleted : true,
          ),
      );
    },
    [filter],
  );

  const handleDelete = useCallback(async (task: Task) => {
    await api.deleteTask(task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }, []);

  if (initializing || !isAuthenticated) {
    return <div className="flex flex-1 items-center justify-center text-slate-400">Loading…</div>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900">Tasks</h1>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="hidden sm:inline">{email}</span>
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <TaskForm onCreate={handleCreate} />

        <div className="mt-6 flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === f.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <section className="mt-4">
          {loading ? (
            <p className="py-12 text-center text-sm text-slate-400">Loading tasks…</p>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}{" "}
              <button onClick={loadTasks} className="font-medium underline underline-offset-2">
                Retry
              </button>
            </div>
          ) : tasks.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              {filter === "all" ? "No tasks yet. Add your first one above." : `No ${filter} tasks.`}
            </p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={setEditing}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      {editing && (
        <EditTaskDialog task={editing} onSave={handleUpdate} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
