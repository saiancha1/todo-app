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

export enum Status {
  Todo = 0,
  InProgress = 1,
  Done = 2,
}

export const statusLabels: Record<Status, string> = {
  [Status.Todo]: "To Do",
  [Status.InProgress]: "In Progress",
  [Status.Done]: "Done",
};

export const statusOrder: Status[] = [Status.Todo, Status.InProgress, Status.Done];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  isCompleted: boolean; // convenience from the API (status === Done)
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
  status?: Status;
}

export interface UpdateTaskInput extends CreateTaskInput {
  status: Status;
}

export type TaskFilter = "all" | "active" | "completed";
