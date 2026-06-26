using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TodoApi.Data;

namespace TodoApi.Tests;

/// <summary>
/// A signature-valid token whose user no longer exists must be rejected with 401,
/// not allowed through to fail later as a 500 (foreign-key violation on write).
/// </summary>
public class AuthHardeningTests : IClassFixture<TodoApiFactory>
{
    private readonly TodoApiFactory _factory;

    public AuthHardeningTests(TodoApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Token_for_deleted_user_is_rejected_with_401()
    {
        var email = $"ghost-{Guid.NewGuid():N}@test.com";
        var client = await _factory.CreateAuthenticatedClientAsync(email);

        // Sanity: the token works while the user exists.
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/tasks")).StatusCode);

        // Remove the user out from under the still-valid token.
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.FirstAsync(u => u.Email == email);
            db.Users.Remove(user);
            await db.SaveChangesAsync();
        }

        // Reads and writes both come back as 401, not 500.
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/tasks")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.CreateTaskAsync("should fail")).StatusCode);
    }
}
