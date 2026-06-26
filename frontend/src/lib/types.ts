export enum Priority {
  Low = 0,
  Medium = 1,
  High = 2,
}

export const priorityLabels: Record<Priority, string> = {
  [Priority.Low]: "Low",
  [Priority.Medium]: "Medium",
  [Priority.High]: "High",
};

export interface Task {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  priority: Priority;
  dueDate: string | null; // ISO 8601 UTC (always ends in Z)
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  expiresAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority: Priority;
  dueDate?: string | null;
}

export interface UpdateTaskInput extends CreateTaskInput {
  isCompleted: boolean;
}

export type TaskFilter = "all" | "active" | "completed";
