/**
 * Thin client over the Todo REST API. Authenticates once with credentials from the
 * environment and caches the JWT, transparently re-authenticating on a 401.
 */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  priority: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

const PRIORITY_NAMES = ["Low", "Medium", "High"];

export class TodoClient {
  private token: string | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly email: string,
    private readonly password: string,
  ) {}

  private async login(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });
    if (!res.ok) {
      throw new Error(
        `Login failed (${res.status}). Check TODO_EMAIL/TODO_PASSWORD and that the account exists.`,
      );
    }
    this.token = ((await res.json()) as { token: string }).token;
  }

  private async request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
    if (!this.token) await this.login();

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
        ...(init.headers ?? {}),
      },
    });

    // Token expired/invalid — re-login once and retry.
    if (res.status === 401 && retry) {
      this.token = null;
      return this.request<T>(path, init, false);
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API error ${res.status}: ${body || res.statusText}`);
    }

    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }

  listTasks(filter: "all" | "active" | "completed" = "all"): Promise<Task[]> {
    return this.request<Task[]>(`/api/tasks?filter=${filter}`);
  }

  createTask(input: {
    title: string;
    description?: string | null;
    priority?: number;
    dueDate?: string | null;
  }): Promise<Task> {
    return this.request<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ priority: 1, ...input }),
    });
  }

  toggleTask(id: string): Promise<Task> {
    return this.request<Task>(`/api/tasks/${id}/toggle`, { method: "PATCH" });
  }

  deleteTask(id: string): Promise<void> {
    return this.request<void>(`/api/tasks/${id}`, { method: "DELETE" });
  }
}

export function formatTask(task: Task): string {
  const box = task.isCompleted ? "[x]" : "[ ]";
  const priority = PRIORITY_NAMES[task.priority] ?? "Medium";
  const due = task.dueDate ? ` · due ${task.dueDate}` : "";
  const desc = task.description ? ` — ${task.description}` : "";
  return `${box} ${task.title}${desc} (${priority}${due}) [id: ${task.id}]`;
}
