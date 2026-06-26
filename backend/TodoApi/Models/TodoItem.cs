namespace TodoApi.Models;

public enum TaskPriority
{
    Low = 0,
    Medium = 1,
    High = 2
}

/// <summary>
/// A single to-do task. Always belongs to exactly one <see cref="User"/>.
/// Due dates are stored in UTC; the client renders them in local time.
/// </summary>
public class TodoItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsCompleted { get; set; }

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    /// <summary>Optional due date, stored as UTC.</summary>
    public DateTime? DueDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Ownership — the spine of our authorization model.
    public Guid UserId { get; set; }

    public User? User { get; set; }
}
