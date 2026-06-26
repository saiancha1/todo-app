using System.Net;
using System.Net.Http.Json;

namespace TodoApi.Tests;

/// <summary>
/// The single most important guarantee in this app: one user can never reach another
/// user's data through any endpoint. These tests exercise that across read/update/delete.
/// </summary>
public class OwnershipTests : IClassFixture<TodoApiFactory>
{
    private readonly TodoApiFactory _factory;

    public OwnershipTests(TodoApiFactory factory) => _factory = factory;

    [Fact]
    public async Task UserB_cannot_read_UserA_task()
    {
        var alice = await _factory.CreateAuthenticatedClientAsync("alice-read@test.com");
        var bob = await _factory.CreateAuthenticatedClientAsync("bob-read@test.com");

        var created = await alice.CreateTaskAsync("Alice's secret");
        var task = await created.Content.ReadFromJsonAsync<TaskDto>();

        var response = await bob.GetAsync($"/api/tasks/{task!.Id}");

        // 404, not 403 — we don't even confirm the task exists.
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UserB_cannot_update_UserA_task()
    {
        var alice = await _factory.CreateAuthenticatedClientAsync("alice-update@test.com");
        var bob = await _factory.CreateAuthenticatedClientAsync("bob-update@test.com");

        var created = await alice.CreateTaskAsync("Alice's task");
        var task = await created.Content.ReadFromJsonAsync<TaskDto>();

        var response = await bob.PutAsJsonAsync($"/api/tasks/{task!.Id}",
            new { title = "Hijacked", description = (string?)null, isCompleted = true, priority = 2, dueDate = (DateTime?)null });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UserB_cannot_delete_UserA_task()
    {
        var alice = await _factory.CreateAuthenticatedClientAsync("alice-delete@test.com");
        var bob = await _factory.CreateAuthenticatedClientAsync("bob-delete@test.com");

        var created = await alice.CreateTaskAsync("Alice's task");
        var task = await created.Content.ReadFromJsonAsync<TaskDto>();

        var response = await bob.DeleteAsync($"/api/tasks/{task!.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        // And confirm it still exists for Alice.
        var stillThere = await alice.GetAsync($"/api/tasks/{task.Id}");
        Assert.Equal(HttpStatusCode.OK, stillThere.StatusCode);
    }

    [Fact]
    public async Task UserB_list_excludes_UserA_tasks()
    {
        var alice = await _factory.CreateAuthenticatedClientAsync("alice-list@test.com");
        var bob = await _factory.CreateAuthenticatedClientAsync("bob-list@test.com");

        await alice.CreateTaskAsync("Alice item");
        await bob.CreateTaskAsync("Bob item");

        var bobTasks = await bob.GetFromJsonAsync<List<TaskDto>>("/api/tasks");

        Assert.NotNull(bobTasks);
        Assert.All(bobTasks!, t => Assert.Equal("Bob item", t.Title));
    }

    [Fact]
    public async Task Unauthenticated_request_is_rejected()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/tasks");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
