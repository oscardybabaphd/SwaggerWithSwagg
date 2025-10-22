# SwaggerWithSwagg

**SwaggerWithSwagg** is an enhanced Swagger UI library for ASP.NET Core that provides a modern, Postman-like interface for testing and documenting your APIs.


---

## ✨ Features

- 🎨 **Modern Postman-like Interface** - Clean, organized sidebar with endpoint collections
- 🔐 **Authorization Management** - Support for Bearer tokens, API keys, OAuth2
- 🚀 **Try It Out Panel** - Execute API requests with automatic request/response caching
- 📁 **File Upload Support** - Single, multiple, and file with metadata uploads
- 🔄 **API Versioning** - Support for multiple API versions with easy switching
- 🌙 **Dark/Light Theme** - Toggle between themes with persistent preference
- 📊 **cURL Generation** - Automatic cURL command generation for all requests

---

## 📦 Installation

```bash
dotnet add package SwaggerWithSwagg
```

**Framework Support:**
- .NET 6.0
- .NET 7.0
- .NET 8.0
- .NET 9.0

---

## 🚀 Usage

### Single API Version

```csharp
using SwaggerWithSwagg;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    // Configure SwaggerGen with all recommended settings for SwaggerWithSwagg
    c.ConfigureForSwaggerWithSwagg();
    
    // Add common operation filters (AllowAnonymous and single content-type)
    c.AddSwaggerWithSwaggFilters();
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerWithSwagg(options =>
{
    options.DocumentTitle = "Sample API - Enhanced Documentation";
    options.SwaggerEndpoint = "../swagger/v1/swagger.json";
    options.RoutePrefix = "swagger";
});

app.UseAuthorization();
app.MapControllers();

app.Run();
```

**Access your API documentation at:** `http://localhost:<port>/swagger`

---

### Multiple API Versions

```csharp
using SwaggerWithSwagg;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    // Configure SwaggerGen with all recommended settings for SwaggerWithSwagg
    c.ConfigureForSwaggerWithSwagg();
    
    // Add common operation filters (AllowAnonymous and single content-type)
    c.AddSwaggerWithSwaggFilters();
    
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
   
    // Configure version filtering
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

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerWithSwagg(options =>
{
    options.DocumentTitle = "Sample API - Enhanced Documentation";
    options.ApiVersions = new List<SwaggerVersion>
    {
        new SwaggerVersion { Name = "v1 - Stable", Endpoint = "/swagger/v1/swagger.json", Description = "Production-ready v1 endpoints" },
        new SwaggerVersion { Name = "v2 - Enhanced", Endpoint = "/swagger/v2/swagger.json", Description = "v2 with enhanced features" }
    };
});

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
```

**Apply versioning to your controllers:**

```csharp
[ApiController]
[Route("api/[controller]")]
[ApiVersion("v1")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    public IActionResult GetProducts()
    {
        return Ok(new[] { "Product A", "Product B" });
    }
}

[ApiController]
[Route("api/[controller]")]
[ApiVersion("v2")]
public class ProductsV2Controller : ControllerBase
{
    [HttpGet]
    public IActionResult GetProducts()
    {
        return Ok(new[] 
        { 
            new { id = 1, name = "Product A", price = 99.99 },
            new { id = 2, name = "Product B", price = 149.99 }
        });
    }
}
```

---

## 📖 Example

Check out the included `SampleApi` project for a complete working example.

Run the sample:
```bash
cd SampleApi
dotnet run
```

Navigate to `http://localhost:5293/swagger` to see SwaggerWithSwagg in action.

---

## � Appendix - Screenshots

### Main Interface
![SwaggerWithSwagg Main Interface](sample_screenshot/Screenshot%202025-10-22%20131743.png)

### API Version Selector
![API Version Selector](sample_screenshot/Screenshot%202025-10-22%20131822.png)

### Try It Out Panel
![Try It Out Panel](sample_screenshot/Screenshot%202025-10-22%20131903.png)

### Request Execution
![Request Execution](sample_screenshot/Screenshot%202025-10-22%20131931.png)

### Response Display
![Response Display](sample_screenshot/Screenshot%202025-10-22%20132017.png)

---

## �📝 License

MIT License

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

