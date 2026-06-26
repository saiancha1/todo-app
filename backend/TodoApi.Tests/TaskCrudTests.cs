using System.Net;
using System.Net.Http.Json;

namespace TodoApi.Tests;

/// <summary>End-to-end happy path: create → list → toggle → update → delete.</summary>
public class TaskCrudTests : IClassFixture<TodoApiFactory>
{
    private readonly TodoApiFactory _factory;

    public TaskCrudTests(TodoApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Full_task_lifecycle_works()
    {
        var client = await _factory.CreateAuthenticatedClientAsync($"crud-{Guid.NewGuid():N}@test.com");

        // Create
        var created = await client.CreateTaskAsync("Write README", "explain setup");
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var task = await created.Content.ReadFromJsonAsync<TaskDto>();
        Assert.Equal(0, task!.Status); // Todo
        Assert.False(task.IsCompleted);

        // List includes it
        var list = await client.GetFromJsonAsync<List<TaskDto>>("/api/tasks");
        Assert.Contains(list!, t => t.Id == task.Id);

        // Move to In Progress via the status endpoint
        var inProgress = await client.PatchAsJsonAsync($"/api/tasks/{task.Id}/status", new { status = 1 });
        var afterStatus = await inProgress.Content.ReadFromJsonAsync<TaskDto>();
        Assert.Equal(1, afterStatus!.Status); // InProgress
        Assert.False(afterStatus.IsCompleted);

        // Toggle completion (Todo/InProgress <-> Done)
        var toggled = await client.PatchAsync($"/api/tasks/{task.Id}/toggle", null);
        var afterToggle = await toggled.Content.ReadFromJsonAsync<TaskDto>();
        Assert.Equal(2, afterToggle!.Status); // Done
        Assert.True(afterToggle.IsCompleted);

        // Update (full edit, including status)
        var updated = await client.PutAsJsonAsync($"/api/tasks/{task.Id}",
            new { title = "Write a great README", description = "with setup steps", status = 0, priority = 2, dueDate = (DateTime?)null });
        var afterUpdate = await updated.Content.ReadFromJsonAsync<TaskDto>();
        Assert.Equal("Write a great README", afterUpdate!.Title);
        Assert.Equal(0, afterUpdate.Status); // back to Todo
        Assert.Equal(2, afterUpdate.Priority);

        // Delete
        var deleted = await client.DeleteAsync($"/api/tasks/{task.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);

        var gone = await client.GetAsync($"/api/tasks/{task.Id}");
        Assert.Equal(HttpStatusCode.NotFound, gone.StatusCode);
    }

    [Fact]
    public async Task Due_date_round_trips_as_utc()
    {
        var client = await _factory.CreateAuthenticatedClientAsync($"date-{Guid.NewGuid():N}@test.com");
        var due = new DateTime(2030, 1, 15, 9, 0, 0, DateTimeKind.Utc);

        var created = await client.PostAsJsonAsync("/api/tasks",
            new { title = "Dated task", description = (string?)null, priority = 1, dueDate = due });
        var task = await created.Content.ReadFromJsonAsync<TaskDto>();

        Assert.Equal(due, task!.DueDate!.Value.ToUniversalTime());
    }
}
