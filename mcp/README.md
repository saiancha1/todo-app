# todo-mcp

A lightweight [Model Context Protocol](https://modelcontextprotocol.io) server that exposes
the Todo API as tools an AI agent can call. It authenticates once with a regular user account
and proxies task operations, so the same per-user ownership rules apply.

## Tools

| Tool            | Description                                            |
| --------------- | ------------------------------------------------------ |
| `list_tasks`    | List your tasks (`filter`: `all` \| `active` \| `completed`) |
| `create_task`   | Create a task (`title`, optional `description`, `priority` 0–2, `dueDate`) |
| `complete_task` | Toggle a task's completed state by `id`                |
| `delete_task`   | Delete a task by `id`                                  |

## Setup

```bash
cd mcp
npm install
npm run build
```

The server needs an **existing** Todo API account (register one in the web app first):

| Env var          | Default                  | Description                |
| ---------------- | ------------------------ | -------------------------- |
| `TODO_API_URL`   | `http://localhost:5080`  | Base URL of the Todo API   |
| `TODO_EMAIL`     | _(required)_             | Account email              |
| `TODO_PASSWORD`  | _(required)_             | Account password           |

### Run it

```bash
TODO_EMAIL=you@example.com TODO_PASSWORD=yourpassword npm start
```

### Register with an MCP client (e.g. Claude Desktop / Claude Code)

```json
{
  "mcpServers": {
    "todo": {
      "command": "node",
      "args": ["/absolute/path/to/to-do/mcp/dist/index.js"],
      "env": {
        "TODO_API_URL": "http://localhost:5080",
        "TODO_EMAIL": "you@example.com",
        "TODO_PASSWORD": "yourpassword"
      }
    }
  }
}
```

The Todo API must be running and the account must already exist.

## Notes

- The JWT is cached in memory and refreshed automatically on a 401.
- Credentials are read from the environment and never logged.
- This is intentionally minimal — it reuses the same REST endpoints and authorization as the web app.
