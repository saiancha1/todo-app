import {
  AuthResponse,
  CreateTaskInput,
  Task,
  TaskFilter,
  UpdateTaskInput,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5080";

const TOKEN_KEY = "todo_token";
const EMAIL_KEY = "todo_email";

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  getEmail: () => (typeof window === "undefined" ? null : localStorage.getItem(EMAIL_KEY)),
  set: (token: string, email: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EMAIL_KEY, email);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
  },
};

/** Thrown for any non-2xx response. Carries a user-facing message and field errors. */
export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string[]>;

  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the API running?");
  }

  if (res.status === 401) {
    // Token missing/expired — clear it so the UI can redirect to login.
    tokenStore.clear();
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (!res.ok) {
    const { message, fieldErrors } = await parseError(res);
    throw new ApiError(res.status, message, fieldErrors);
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

async function parseError(res: Response): Promise<{ message: string; fieldErrors: Record<string, string[]> }> {
  try {
    const body = await res.json();
    // ASP.NET ProblemDetails validation shape: { errors: { Field: ["msg"] } }
    if (body?.errors && typeof body.errors === "object") {
      const fieldErrors = body.errors as Record<string, string[]>;
      const first = Object.values(fieldErrors).flat()[0];
      return { message: first ?? body.title ?? "Validation failed.", fieldErrors };
    }
    return { message: body?.message ?? body?.title ?? "Something went wrong.", fieldErrors: {} };
  } catch {
    return { message: "Something went wrong.", fieldErrors: {} };
  }
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  listTasks: (filter: TaskFilter) => request<Task[]>(`/api/tasks?filter=${filter}`),

  createTask: (input: CreateTaskInput) =>
    request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(input) }),

  updateTask: (id: string, input: UpdateTaskInput) =>
    request<Task>(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(input) }),

  toggleTask: (id: string) => request<Task>(`/api/tasks/${id}/toggle`, { method: "PATCH" }),

  deleteTask: (id: string) => request<void>(`/api/tasks/${id}`, { method: "DELETE" }),
};
