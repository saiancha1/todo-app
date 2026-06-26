using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using TodoApi.Auth;
using TodoApi.Data;

var builder = WebApplication.CreateBuilder(args);

// ---- Configuration ----
var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrWhiteSpace(jwtOptions.Key))
    throw new InvalidOperationException("Jwt:Key is not configured. Set it in appsettings or the JWT__KEY env var.");

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                  ?? new[] { "http://localhost:3000" };

// ---- Services ----
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=todo.db"));

builder.Services.AddSingleton(jwtOptions);
builder.Services.AddScoped<JwtTokenService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Standardize error responses (incl. unhandled 500s) as RFC 7807 ProblemDetails,
// which the frontend already knows how to parse.
builder.Services.AddProblemDetails();

// One concise log line per request (method, path, status, duration) so a reported
// issue can be traced to the endpoint that handled it.
builder.Services.AddHttpLogging(options =>
{
    options.LoggingFields = HttpLoggingFields.RequestMethod
        | HttpLoggingFields.RequestPath
        | HttpLoggingFields.ResponseStatusCode
        | HttpLoggingFields.Duration;
    options.CombineLogs = true;
});

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// ---- Apply migrations on startup so a fresh clone just runs. ----
// Skipped under the "Testing" environment, where tests own schema creation.
if (!app.Environment.IsEnvironment("Testing"))
{
    using var scope = app.Services.CreateScope();
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

// ---- Pipeline ----
// Turns unhandled exceptions into ProblemDetails responses instead of leaking stack traces.
app.UseExceptionHandler();

app.UseHttpLogging();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); // interactive API explorer at /scalar/v1
}

app.UseCors();
app.UseAuthentication();

// Attach the authenticated user's id to the logging scope so every log line emitted
// while handling the request is tagged with who made it.
app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated == true)
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        // Message-template scope so it renders as "UserId:<id>" in the console and stays
        // structured ({UserId}) for JSON/aggregated sinks.
        using (logger.BeginScope("UserId:{UserId}", context.User.GetUserId()))
        {
            await next();
            return;
        }
    }

    await next();
});

app.UseAuthorization();
app.MapControllers();

app.Run();

// Exposed so the integration test project can spin up the app via WebApplicationFactory<Program>.
public partial class Program { }
