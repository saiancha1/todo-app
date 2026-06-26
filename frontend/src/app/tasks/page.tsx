"use client";

import { LayoutGrid, List } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Board from "@/components/board/Board";
import EditTaskDialog from "@/components/EditTaskDialog";
import TaskForm from "@/components/TaskForm";
import TaskItem from "@/components/TaskItem";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { CreateTaskInput, Task, TaskFilter, UpdateTaskInput } from "@/lib/types";

type View = "list" | "board";

const VIEW_KEY = "todo_view";
const filters: { key: TaskFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

export default function TasksPage() {
  const router = useRouter();
  const { email, isAuthenticated, initializing, logout } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<View>("list");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);

  // Restore the last-used view.
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === "board" || saved === "list") setView(saved);
  }, []);

  const changeView = useCallback((next: View) => {
    setView(next);
    localStorage.setItem(VIEW_KEY, next);
  }, []);

  // Redirect unauthenticated users once auth state has rehydrated.
  useEffect(() => {
    if (!initializing && !isAuthenticated) router.replace("/login");
  }, [initializing, isAuthenticated, router]);

  // Fetch everything once; both views filter the same in-memory list.
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTasks(await api.listTasks("all"));
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
  }, [logout, router]);

  useEffect(() => {
    if (isAuthenticated) loadTasks();
  }, [isAuthenticated, loadTasks]);

  // --- Mutations: update local state immediately, no full-page refresh. ---

  const handleCreate = useCallback(async (input: CreateTaskInput) => {
    const created = await api.createTask(input);
    setTasks((prev) => [created, ...prev]);
  }, []);

  const handleToggle = useCallback(async (task: Task) => {
    const updated = await api.toggleTask(task.id);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const handleUpdate = useCallback(async (id: string, input: UpdateTaskInput) => {
    const updated = await api.updateTask(id, input);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const handleDelete = useCallback(async (task: Task) => {
    await api.deleteTask(task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }, []);

  const listTasks = useMemo(
    () =>
      tasks.filter((t) =>
        filter === "active" ? !t.isCompleted : filter === "completed" ? t.isCompleted : true,
      ),
    [tasks, filter],
  );

  if (initializing || !isAuthenticated) {
    return <div className="flex flex-1 items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold">Tasks</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <TaskForm onCreate={handleCreate} />

        <div className="mt-6 flex items-center justify-between gap-2">
          {/* List-only filters; the board always shows both columns. */}
          <div className="flex gap-1">
            {view === "list" &&
              filters.map((f) => (
                <Button
                  key={f.key}
                  variant={filter === f.key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </Button>
              ))}
          </div>

          {/* View switcher */}
          <div className="flex gap-1 rounded-lg border p-0.5">
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => changeView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
            >
              <List className="size-4" /> List
            </Button>
            <Button
              variant={view === "board" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => changeView("board")}
              aria-label="Board view"
              aria-pressed={view === "board"}
            >
              <LayoutGrid className="size-4" /> Board
            </Button>
          </div>
        </div>

        <section className="mt-4">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Loading tasks…</p>
          ) : error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}{" "}
              <button onClick={loadTasks} className="font-medium underline underline-offset-2">
                Retry
              </button>
            </div>
          ) : tasks.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No tasks yet. Add your first one above.
            </p>
          ) : view === "board" ? (
            <Board tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} onEdit={setEditing} />
          ) : listTasks.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No {filter} tasks.</p>
          ) : (
            <ul className="space-y-2">
              {listTasks.map((task) => (
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
