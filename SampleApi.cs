using SwaggerWithSwagg;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Sample API with SwaggerWithSwagg",
        Version = "v1",
        Description = "A sample API demonstrating SwaggerWithSwagg enhanced UI features",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "API Team",
            Email = "api@example.com"
        }
    });
});

// Add SwaggerWithSwagg
builder.Services.AddSwaggerWithSwagg();

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseSwagger();

// Use SwaggerWithSwagg UI with custom configuration
app.UseSwaggerWithSwagg(options =>
{
    options.RoutePrefix = "swagger";
    options.SwaggerEndpoint = "/swagger/v1/swagger.json";
    options.DocumentTitle = "Sample API - Enhanced Documentation";
    options.EnableRequestHistory = true;
    options.MaxHistorySize = 100;
    options.CustomCss = @"
        .swagg-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        }
    ";
});

// Sample endpoints
var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.WithDescription("Get a 5-day weather forecast")
.WithOpenApi();

app.MapGet("/weatherforecast/{days}", (int days) =>
{
    if (days < 1 || days > 30)
    {
        return Results.BadRequest("Days must be between 1 and 30");
    }

    var forecast = Enumerable.Range(1, days).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return Results.Ok(forecast);
})
.WithName("GetWeatherForecastForDays")
.WithDescription("Get weather forecast for a specified number of days")
.WithOpenApi();

app.MapPost("/weatherforecast", (WeatherForecast forecast) =>
{
    return Results.Created($"/weatherforecast/{forecast.Date}", forecast);
})
.WithName("CreateWeatherForecast")
.WithDescription("Create a new weather forecast entry")
.WithOpenApi();

app.MapPut("/weatherforecast/{date}", (DateOnly date, WeatherForecast forecast) =>
{
    return Results.Ok(forecast);
})
.WithName("UpdateWeatherForecast")
.WithDescription("Update an existing weather forecast")
.WithOpenApi();

app.MapDelete("/weatherforecast/{date}", (DateOnly date) =>
{
    return Results.NoContent();
})
.WithName("DeleteWeatherForecast")
.WithDescription("Delete a weather forecast entry")
.WithOpenApi();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
