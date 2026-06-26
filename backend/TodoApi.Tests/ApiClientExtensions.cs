using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace TodoApi.Tests;

public record AuthResult(string Token, string Email, DateTime ExpiresAt);

public record TaskDto(
    Guid Id, string Title, string? Description, bool IsCompleted,
    int Priority, DateTime? DueDate, DateTime CreatedAt, DateTime UpdatedAt);

public static class ApiClientExtensions
{
    /// <summary>Registers a fresh user and returns a client pre-authenticated as that user.</summary>
    public static async Task<HttpClient> CreateAuthenticatedClientAsync(this TodoApiFactory factory, string email)
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email, password = "Password123!" });
        response.EnsureSuccessStatusCode();

        var auth = await response.Content.ReadFromJsonAsync<AuthResult>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }

    public static Task<HttpResponseMessage> CreateTaskAsync(this HttpClient client, string title, string? description = null) =>
        client.PostAsJsonAsync("/api/tasks", new { title, description, priority = 1, dueDate = (DateTime?)null });
}
