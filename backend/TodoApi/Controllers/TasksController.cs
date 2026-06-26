using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;
using TodoApi.Auth;
using TodoApi.Data;
using TodoApi.Dtos;
using TodoApi.Models;

namespace TodoApi.Controllers;

[ApiController]
[Authorize]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<TasksController> _logger;

    public TasksController(AppDbContext db, ILogger<TasksController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Lists the current user's tasks. Optional filter: all | active | completed.
    /// Every query is scoped to the authenticated user — the spine of ownership enforcement.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskResponse>>> GetAll(
        [FromQuery] string filter = "all",
        CancellationToken ct = default)
    {
        var userId = User.GetUserId();
        // Read-only: no change tracking needed.
        var query = _db.Tasks.AsNoTracking().Where(t => t.UserId == userId);

        query = filter.ToLowerInvariant() switch
        {
            "active" => query.Where(t => t.Status != TaskState.Done),
            "completed" => query.Where(t => t.Status == TaskState.Done),
            _ => query
        };

        var tasks = await query
            .OrderBy(t => t.Status)
            .ThenByDescending(t => t.Priority)
            .ThenBy(t => t.DueDate ?? DateTime.MaxValue)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => TaskResponse.From(t))
            .ToListAsync(ct);

        return Ok(tasks);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TaskResponse>> GetById(Guid id, CancellationToken ct)
    {
        var task = await FindOwnedAsync(id, ct);
        return task is null ? TaskNotFound(id) : Ok(TaskResponse.From(task));
    }

    [HttpPost]
    [ProducesResponseType(typeof(TaskResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TaskResponse>> Create(CreateTaskRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return ValidationProblem(TitleRequired());

        var task = new TodoItem
        {
            UserId = User.GetUserId(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Status = request.Status,
            Priority = request.Priority,
            DueDate = ToUtc(request.DueDate)
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Task {TaskId} created", task.Id);
        return CreatedAtAction(nameof(GetById), new { id = task.Id }, TaskResponse.From(task));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TaskResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskResponse>> Update(Guid id, UpdateTaskRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return ValidationProblem(TitleRequired());

        var task = await FindOwnedAsync(id, ct);
        if (task is null) return TaskNotFound(id);

        task.Title = request.Title.Trim();
        task.Description = request.Description?.Trim();
        task.Status = request.Status;
        task.Priority = request.Priority;
        task.DueDate = ToUtc(request.DueDate);
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return Ok(TaskResponse.From(task));
    }

    /// <summary>Set a task's workflow state directly (used by the board and the list status control).</summary>
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(TaskResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskResponse>> SetStatus(Guid id, UpdateStatusRequest request, CancellationToken ct)
    {
        var task = await FindOwnedAsync(id, ct);
        if (task is null) return TaskNotFound(id);

        task.Status = request.Status;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return Ok(TaskResponse.From(task));
    }

    /// <summary>Convenience toggle between Done and Todo — used by the MCP server.</summary>
    [HttpPatch("{id:guid}/toggle")]
    [ProducesResponseType(typeof(TaskResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskResponse>> Toggle(Guid id, CancellationToken ct)
    {
        var task = await FindOwnedAsync(id, ct);
        if (task is null) return TaskNotFound(id);

        task.Status = task.Status == TaskState.Done ? TaskState.Todo : TaskState.Done;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return Ok(TaskResponse.From(task));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var task = await FindOwnedAsync(id, ct);
        if (task is null) return TaskNotFound(id);

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Task {TaskId} deleted", id);
        return NoContent();
    }

    /// <summary>
    /// Loads a task only if it belongs to the current user. Returning null (→ 404) for
    /// someone else's task means we never confirm another user's data even exists.
    /// </summary>
    private async Task<TodoItem?> FindOwnedAsync(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        return await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId, ct);
    }

    /// <summary>
    /// 404 for a missing or non-owned task. Logged at Warning (with the user id from the
    /// request's log scope) so cross-user access attempts and "my task vanished" reports are visible.
    /// </summary>
    private NotFoundResult TaskNotFound(Guid id)
    {
        _logger.LogWarning("Task {TaskId} not found or not owned by the requesting user", id);
        return NotFound();
    }

    private static ModelStateDictionary TitleRequired()
    {
        var modelState = new ModelStateDictionary();
        modelState.AddModelError(nameof(CreateTaskRequest.Title), "Title is required.");
        return modelState;
    }

    /// <summary>Normalize incoming dates to UTC so due dates behave correctly across timezones.</summary>
    private static DateTime? ToUtc(DateTime? value) => value switch
    {
        null => null,
        { Kind: DateTimeKind.Utc } => value,
        { Kind: DateTimeKind.Local } => value.Value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)
    };
}
