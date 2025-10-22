using SwaggerWithSwagg;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    // Define v1 API
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Sample API",
        Version = "v1",
        Description = "Version 1 of the Sample API with basic endpoints",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "API Team",
            Email = "api@example.com"
        }
    });

    // Define v2 API
    c.SwaggerDoc("v2", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Sample API",
        Version = "v2",
        Description = "Version 2 of the Sample API with enhanced features",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "API Team",
            Email = "api@example.com"
        }
    });

    // Define beta API
    c.SwaggerDoc("beta", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Sample API",
        Version = "beta",
        Description = "Beta version with experimental features",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "API Team",
            Email = "api@example.com"
        }
    });

    // Configure SwaggerGen with all recommended settings for SwaggerWithSwagg
    c.ConfigureForSwaggerWithSwagg();
    
    // Add common operation filters (AllowAnonymous and single content-type)
    c.AddSwaggerWithSwaggFilters();

    // Add security definitions
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Enter your JWT token in the format: Bearer {your token}"
    });

    c.AddSecurityDefinition("ApiKey", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Name = "X-API-Key",
        Description = "API Key authentication"
    });

    // Add security requirement globally
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });

    // Configure API version filtering for controllers - each version shows only its own endpoints
    c.DocInclusionPredicate((docName, apiDesc) =>
    {
        var actionDescriptor = apiDesc.ActionDescriptor as Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor;
        if (actionDescriptor == null) return false;

        var apiVersion = actionDescriptor.ControllerTypeInfo
            .GetCustomAttributes(typeof(ApiVersionAttribute), true)
            .Cast<ApiVersionAttribute>()
            .FirstOrDefault();

        if (apiVersion == null) return docName == "v1"; // Default to v1

        var version = apiVersion.Version;
        
        // Each version shows only its own endpoints
        return docName == version;
    });
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseSwagger();
app.UseSwaggerWithSwagg(options =>
{
    options.DocumentTitle = "Sample API - Enhanced Documentation";
    options.ApiVersions = new List<SwaggerVersion>
    {
        new SwaggerVersion { Name = "v1 - Stable", Endpoint = "/swagger/v1/swagger.json", Description = "Production-ready v1 endpoints" },
        new SwaggerVersion { Name = "v2 - Enhanced", Endpoint = "/swagger/v2/swagger.json", Description = "v2 with enhanced features" },
        new SwaggerVersion { Name = "beta - Experimental", Endpoint = "/swagger/beta/swagger.json", Description = "Beta features (use with caution)" }
    };
});

app.UseCors();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Custom attribute for API versioning
[AttributeUsage(AttributeTargets.Class, AllowMultiple = false)]
public class ApiVersionAttribute : Attribute
{
    public string Version { get; }
    public ApiVersionAttribute(string version)
    {
        Version = version;
    }
}
