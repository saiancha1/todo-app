#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { formatTask, TodoClient } from "./todoClient.js";

const BASE_URL = process.env.TODO_API_URL ?? "http://localhost:5080";
const EMAIL = process.env.TODO_EMAIL;
const PASSWORD = process.env.TODO_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("Set TODO_EMAIL and TODO_PASSWORD env vars (an existing Todo API account).");
  process.exit(1);
}

const client = new TodoClient(BASE_URL, EMAIL, PASSWORD);
const server = new McpServer({ name: "todo-mcp", version: "1.0.0" });

/** Wrap a handler so any thrown error becomes a clean MCP error result. */
function ok(text: string) {
  return { content: [{ type: "text" as const, text }] };
}
function fail(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
}

server.registerTool(
  "list_tasks",
  {
    title: "List tasks",
    description: "List the authenticated user's tasks, optionally filtered by status.",
    inputSchema: { filter: z.enum(["all", "active", "completed"]).optional() },
  },
  async ({ filter }) => {
    try {
      const tasks = await client.listTasks(filter ?? "all");
      if (tasks.length === 0) return ok("No tasks found.");
      return ok(tasks.map(formatTask).join("\n"));
    } catch (err) {
      return fail(err);
    }
  },
);

server.registerTool(
  "create_task",
  {
    title: "Create task",
    description: "Create a new task. Title is required; priority is 0=Low, 1=Medium, 2=High.",
    inputSchema: {
      title: z.string().min(1, "Title is required."),
      description: z.string().optional(),
      priority: z.number().int().min(0).max(2).optional(),
      dueDate: z.string().describe("ISO 8601 UTC, e.g. 2030-01-01T09:00:00Z").optional(),
    },
  },
  async ({ title, description, priority, dueDate }) => {
    try {
      const task = await client.createTask({ title, description, priority, dueDate });
      return ok(`Created:\n${formatTask(task)}`);
    } catch (err) {
      return fail(err);
    }
  },
);

server.registerTool(
  "complete_task",
  {
    title: "Toggle task completion",
    description: "Flip a task's completed state by id.",
    inputSchema: { id: z.string().uuid() },
  },
  async ({ id }) => {
    try {
      const task = await client.toggleTask(id);
      return ok(`Updated:\n${formatTask(task)}`);
    } catch (err) {
      return fail(err);
    }
  },
);

server.registerTool(
  "delete_task",
  {
    title: "Delete task",
    description: "Permanently delete a task by id.",
    inputSchema: { id: z.string().uuid() },
  },
  async ({ id }) => {
    try {
      await client.deleteTask(id);
      return ok(`Deleted task ${id}.`);
    } catch (err) {
      return fail(err);
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`todo-mcp connected (API: ${BASE_URL})`);
