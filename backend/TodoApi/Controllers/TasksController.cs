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

    public TasksController(AppDbContext db) => _db = db;

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
            "active" => query.Where(t => !t.IsCompleted),
            "completed" => query.Where(t => t.IsCompleted),
            _ => query
        };

        var tasks = await query
            .OrderBy(t => t.IsCompleted)
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
        return task is null ? NotFound() : Ok(TaskResponse.From(task));
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
            Priority = request.Priority,
            DueDate = ToUtc(request.DueDate)
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync(ct);

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
        if (task is null) return NotFound();

        task.Title = request.Title.Trim();
        task.Description = request.Description?.Trim();
        task.IsCompleted = request.IsCompleted;
        task.Priority = request.Priority;
        task.DueDate = ToUtc(request.DueDate);
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return Ok(TaskResponse.From(task));
    }

    /// <summary>Convenience endpoint for the most common mutation: flipping completion.</summary>
    [HttpPatch("{id:guid}/toggle")]
    [ProducesResponseType(typeof(TaskResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskResponse>> Toggle(Guid id, CancellationToken ct)
    {
        var task = await FindOwnedAsync(id, ct);
        if (task is null) return NotFound();

        task.IsCompleted = !task.IsCompleted;
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
        if (task is null) return NotFound();

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync(ct);
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
