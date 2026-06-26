using System.Net;
using System.Net.Http.Json;

namespace TodoApi.Tests;

/// <summary>
/// The app must reject bad input with a 400, not silently accept or crash on it.
/// </summary>
public class ValidationTests : IClassFixture<TodoApiFactory>
{
    private readonly TodoApiFactory _factory;

    public ValidationTests(TodoApiFactory factory) => _factory = factory;

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Create_task_with_blank_title_is_rejected(string title)
    {
        var client = await _factory.CreateAuthenticatedClientAsync($"val-{Guid.NewGuid():N}@test.com");

        var response = await client.PostAsJsonAsync("/api/tasks",
            new { title, description = "x", priority = 1, dueDate = (DateTime?)null });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_with_invalid_email_is_rejected()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register",
            new { email = "not-an-email", password = "Password123!" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_with_short_password_is_rejected()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register",
            new { email = $"short-{Guid.NewGuid():N}@test.com", password = "short" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Duplicate_registration_is_rejected()
    {
        var email = $"dupe-{Guid.NewGuid():N}@test.com";
        var client = _factory.CreateClient();

        var first = await client.PostAsJsonAsync("/api/auth/register", new { email, password = "Password123!" });
        var second = await client.PostAsJsonAsync("/api/auth/register", new { email, password = "Password123!" });

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }
}
