using System.ComponentModel.DataAnnotations;
using TodoApi.Models;

namespace TodoApi.Dtos;

public record CreateTaskRequest(
    [Required(AllowEmptyStrings = false, ErrorMessage = "Title is required."), MaxLength(200)]
    string Title,
    [MaxLength(2000)] string? Description,
    TaskPriority Priority = TaskPriority.Medium,
    DateTime? DueDate = null,
    TaskState Status = TaskState.Todo);

public record UpdateTaskRequest(
    [Required(AllowEmptyStrings = false, ErrorMessage = "Title is required."), MaxLength(200)]
    string Title,
    [MaxLength(2000)] string? Description,
    TaskState Status,
    TaskPriority Priority,
    DateTime? DueDate);

public record UpdateStatusRequest(TaskState Status);

public record TaskResponse(
    Guid Id,
    string Title,
    string? Description,
    TaskState Status,
    bool IsCompleted,
    TaskPriority Priority,
    DateTime? DueDate,
    DateTime CreatedAt,
    DateTime UpdatedAt)
{
    public static TaskResponse From(TodoItem t) => new(
        t.Id, t.Title, t.Description, t.Status, t.Status == TaskState.Done,
        t.Priority, t.DueDate, t.CreatedAt, t.UpdatedAt);
}
