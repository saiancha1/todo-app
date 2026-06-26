namespace TodoApi.Models;

/// <summary>
/// An application user. Owns a collection of <see cref="TodoItem"/>s.
/// Passwords are never stored in plain text — only the BCrypt hash.
/// </summary>
public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TodoItem> Tasks { get; set; } = new List<TodoItem>();
}
