# SwaggerWithSwagg

**SwaggerWithSwagg** is an enhanced Swagger UI library for ASP.NET Core that provides a modern, Postman-like interface for testing and documenting your APIs. It offers advanced features like per-endpoint request caching, authorization management, API versioning support, file uploads, and a beautiful dark/light theme.

![SwaggerWithSwagg Banner](https://img.shields.io/badge/SwaggerWithSwagg-Enhanced_Swagger_UI-orange?style=for-the-badge)

## ✨ Features

### 🎨 **Modern UI/UX**
- **Postman-like Interface**: Clean, organized sidebar with endpoint collections
- **Dark/Light Theme**: Toggle between themes with persistent preference
- **Responsive Design**: Works seamlessly on desktop and tablet devices
- **Collapsible Sections**: Organize endpoints by tags/categories

### 🔐 **Authorization Management**
- **Multiple Auth Schemes**: Support for Bearer tokens, API keys, OAuth2
- **Persistent Storage**: Authorization tokens stored in browser localStorage
- **Visual Indicators**: See which endpoints require authentication
- **Easy Management**: Centralized auth modal for managing credentials

### 🚀 **Try It Out Panel**
- **Side Panel Interface**: Execute API requests without leaving the documentation
- **Request Caching**: Automatically caches the last request/response for each endpoint
- **Multiple Content Types**: JSON, multipart/form-data, and more
- **Custom Headers**: Add and manage custom HTTP headers
- **File Upload Support**: Upload single or multiple files with metadata
- **cURL Generation**: Automatic cURL command generation for all requests

### 📁 **File Upload Support**
- **Single File Upload**: Upload individual files with validation
- **Multiple File Upload**: Select and upload multiple files at once
- **File with Metadata**: Combine file uploads with additional form fields
- **Visual Feedback**: See selected file names, sizes, and types
- **Proper cURL Commands**: Generate correct multipart/form-data cURL commands

### 🔄 **API Versioning**
- **Multiple Versions**: Support for v1, v2, beta, and custom versions
- **Version Selector**: Easy dropdown to switch between API versions
- **Version Filtering**: Show only endpoints for the selected version
- **Separate Specifications**: Each version can have its own Swagger JSON

### 📊 **API Information Display**
- **Version Info**: Display current API version
- **Description**: Show API description and purpose
- **Contact Information**: Display API team contact details
- **Swagger JSON Link**: Direct link to raw OpenAPI specification

### 🎯 **Developer Experience**
- **Search Functionality**: Quickly find endpoints by name or path
- **Syntax Highlighting**: Beautiful code formatting for requests/responses
- **Response Display**: Auto-prettified JSON responses
- **Error Handling**: Clear error messages and validation feedback
- **Request Caching**: Preserve the last request/response per endpoint across page reloads

---

## 📦 Installation

### NuGet Package (Coming Soon)
```bash
dotnet add package SwaggerWithSwagg
```

### Manual Installation
1. Clone or download this repository
2. Build the `SwaggerWithSwagg` project:
   ```bash
   cd SwaggerWithSwagg
   dotnet build
   ```
3. Reference the DLL in your ASP.NET Core project

---

## 🚀 Quick Start

### 1. Basic Setup

Add SwaggerWithSwagg to your `Program.cs`:

```csharp
using SwaggerWithSwagg;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure Swagger and SwaggerWithSwagg
app.UseSwagger();
app.UseSwaggerWithSwagg(new SwaggerWithSwaggOptions
{
    SwaggerEndpoint = "/swagger/v1/swagger.json",
    DocumentTitle = "My API Documentation",
    RoutePrefix = "api-docs"
});

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### 2. Access the UI


---

## ⚙️ Configuration Options

### SwaggerWithSwaggOptions

Configure SwaggerWithSwagg with the following options:

```csharp
app.UseSwaggerWithSwagg(new SwaggerWithSwaggOptions
{
    // Swagger JSON endpoint
    SwaggerEndpoint = "/swagger/v1/swagger.json",
    
    // Page title
    DocumentTitle = "My API Documentation",
    
    // URL route prefix (don't include leading slash)
    RoutePrefix = "api-docs",
    
    // API versions (optional)
    ApiVersions = new List<ApiVersion>
    {
        new ApiVersion 
        { 
            Name = "v1", 
            Endpoint = "/swagger/v1/swagger.json",
            Description = "Version 1 - Stable" 
        },
        new ApiVersion 
        { 
            Name = "v2", 
            Endpoint = "/swagger/v2/swagger.json",
            Description = "Version 2 - Latest features" 
        },
        new ApiVersion 
        { 
            Name = "beta", 
            Endpoint = "/swagger/beta/swagger.json",
            Description = "Beta - Experimental" 
        }
    },
    
    // Custom CSS (optional)
    CustomCss = @"
        :root {
            --orange: #FF6C37;
            /* Add your custom styles here */
        }
    "
});
```

---

## 🔐 Authorization Setup

### 1. Configure Security Schemes in Swagger

```csharp
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "My API", 
        Version = "v1" 
    });
    
    // Bearer Token Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    
    // API Key Authentication
    c.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
    {
        Description = "API Key Authentication",
        Name = "X-API-Key",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey
    });
    
    // Global security requirement
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});
```

### 2. Using Authorization in the UI

1. Click the **"Authorize"** button in the header
2. Enter your authentication credentials (Bearer token, API key, etc.)
3. Click **"Authorize"** to save
4. The credentials will be automatically included in all subsequent requests
5. Endpoints requiring auth will show a lock icon 🔒

### 3. Endpoint-Level Authorization

Secure specific endpoints:

```csharp
[ApiController]
[Route("api/[controller]")]
public class SecureController : ControllerBase
{
    [HttpGet]
    [Authorize] // Requires authentication
    public IActionResult GetSecureData()
    {
        return Ok(new { message = "Secure data" });
    }
    
    [HttpGet("public")]
    public IActionResult GetPublicData()
    {
        return Ok(new { message = "Public data" });
    }
}
```

---

## 📁 File Upload Endpoints

### 1. Single File Upload

```csharp
[HttpPost("upload")]
[Consumes("multipart/form-data")]
public IActionResult UploadFile(IFormFile file)
{
    if (file == null || file.Length == 0)
        return BadRequest("No file uploaded");
    
    return Ok(new 
    { 
        fileName = file.FileName,
        size = file.Length,
        contentType = file.ContentType
    });
}
```

### 2. File Upload with Metadata

```csharp
public class FileUploadRequest
{
    public IFormFile File { get; set; }
    public string Description { get; set; }
    public string Category { get; set; }
}

[HttpPost("upload-with-metadata")]
[Consumes("multipart/form-data")]
public IActionResult UploadFileWithMetadata([FromForm] FileUploadRequest request)
{
    return Ok(new 
    { 
        fileName = request.File.FileName,
        description = request.Description,
        category = request.Category
    });
}
```

### 3. Multiple File Upload

```csharp
[HttpPost("upload-multiple")]
[Consumes("multipart/form-data")]
public IActionResult UploadMultipleFiles(List<IFormFile> files)
{
    return Ok(new 
    { 
        totalFiles = files.Count,
        files = files.Select(f => new 
        {
            name = f.FileName,
            size = f.Length
        })
    });
}
```

**Note**: SwaggerWithSwagg automatically detects `multipart/form-data` endpoints and provides a file upload UI with:
- File selection with visual feedback
- File size and type display
- Multiple file support
- Proper cURL command generation

---

## 🔄 API Versioning

### 1. Configure API Versioning

Install the package:
```bash
dotnet add package Microsoft.AspNetCore.Mvc.Versioning
```

Configure in `Program.cs`:
```csharp
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
});
```

### 2. Create Versioned Controllers

**V1 Controller:**
```csharp
namespace MyApi.Controllers.V1
{
    [ApiController]
    [Route("api/v{version:apiVersion}/[controller]")]
    [ApiVersion("1.0")]
    public class ProductsController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetProducts()
        {
            return Ok(new[] { "Product A", "Product B" });
        }
    }
}
```

**V2 Controller:**
```csharp
namespace MyApi.Controllers.V2
{
    [ApiController]
    [Route("api/v{version:apiVersion}/[controller]")]
    [ApiVersion("2.0")]
    public class ProductsController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetProducts()
        {
            // Enhanced version with more data
            return Ok(new[] 
            { 
                new { id = 1, name = "Product A", price = 99.99 },
                new { id = 2, name = "Product B", price = 149.99 }
            });
        }
    }
}
```

### 3. Configure Swagger for Multiple Versions

```csharp
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "My API - V1", 
        Version = "v1",
        Description = "Version 1 - Stable release"
    });
    
    c.SwaggerDoc("v2", new OpenApiInfo 
    { 
        Title = "My API - V2", 
        Version = "v2",
        Description = "Version 2 - Latest features"
    });
    
    c.DocInclusionPredicate((docName, apiDesc) =>
    {
        var versions = apiDesc.ActionDescriptor.EndpointMetadata
            .OfType<ApiVersionAttribute>()
            .SelectMany(attr => attr.Versions);
        
        return versions.Any(v => $"v{v.MajorVersion}" == docName);
    });
});

// Configure Swagger endpoints
app.UseSwagger();
app.MapSwagger("/swagger/{documentName}/swagger.json");

// Configure SwaggerWithSwagg with versions
app.UseSwaggerWithSwagg(new SwaggerWithSwaggOptions
{
    SwaggerEndpoint = "/swagger/v1/swagger.json",
    DocumentTitle = "My API",
    RoutePrefix = "api-docs",
    ApiVersions = new List<ApiVersion>
    {
        new ApiVersion { Name = "v1", Endpoint = "/swagger/v1/swagger.json" },
        new ApiVersion { Name = "v2", Endpoint = "/swagger/v2/swagger.json" }
    }
});
```

---

## 🎯 Using the Try It Out Panel

### 1. Opening the Panel

1. Navigate to any endpoint in the sidebar
2. Click the endpoint to view details
3. Click the **"Try It Out"** button
4. The side panel opens on the right

### 2. Making Requests

**For JSON Requests:**
1. The panel shows a JSON editor with example data
2. Modify the JSON as needed
3. Click **"Execute"** to send the request
4. View the response below

**For File Uploads:**
1. The panel automatically shows file input fields
2. Click "Choose File" to select file(s)
3. Fill in any additional metadata fields
4. Click **"Execute"** to upload
5. View the upload confirmation

### 3. Adding Custom Headers

1. In the Try It Out panel, find the "Headers" section
2. Click **"Add Header"**
3. Enter header name and value
4. The header will be included in the request
5. Custom headers are cached for the session

### 4. Viewing cURL Commands

Every request automatically generates a cURL command:
1. After making a request, scroll to the **"cURL Command"** section
2. Click to expand
3. Click **"Copy"** to copy to clipboard
4. Use in terminal or share with team members

**Example cURL for JSON:**
```bash
curl -X POST 'https://localhost:7001/api/Orders' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{"productName":"Laptop","quantity":2,"isPriority":true}'
```

**Example cURL for File Upload:**
```bash
curl -X POST 'https://localhost:7001/api/Files/upload-multiple' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'files=@document1.pdf' \
  -F 'files=@image.jpg' \
  -F 'files=@data.csv'
```

---

## 🎨 Customization

### Custom Styling

Add custom CSS to match your brand:

```csharp
app.UseSwaggerWithSwagg(new SwaggerWithSwaggOptions
{
    SwaggerEndpoint = "/swagger/v1/swagger.json",
    DocumentTitle = "My API",
    RoutePrefix = "api-docs",
    CustomCss = @"
        /* Change primary color */
        :root {
            --orange: #007bff;
        }
        
        /* Custom header styling */
        .swagg-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        /* Custom button styling */
        .try-it-button {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
    "
});
```

### Custom Logo

Replace the default "S" logo by modifying the CSS:

```css
.swagg-logo {
    background-image: url('https://yoursite.com/logo.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    font-size: 0; /* Hide the 'S' text */
}
```

---

## 📚 Advanced Features

### Request Caching

SwaggerWithSwagg automatically caches the last request for each endpoint:
- Request body
- Response data
- Custom headers
- Selected content type

The cache persists across page reloads using browser localStorage, allowing you to quickly re-execute the same request without re-entering data.

**Clear Cache:**
```javascript
// Open browser console and run:
localStorage.clear();
```

### Search Functionality

Use the search box in the sidebar to:
- Find endpoints by name
- Search by HTTP method
- Filter by path
- Locate specific operations quickly

### Endpoint Organization

Endpoints are automatically organized by:
- **Tags**: Groups defined in Swagger annotations
- **HTTP Methods**: GET, POST, PUT, DELETE, PATCH
- **Authorization**: Secured vs. public endpoints

### Dark/Light Theme

Toggle between themes:
1. Click the theme toggle button in the header (🌙/☀️)
2. Theme preference is saved to localStorage
3. Applies to all UI components automatically

---

## 🔍 Troubleshooting

### CORS Issues

If requests fail due to CORS:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

app.UseCors("AllowAll");
```

### Authorization Not Working

Ensure:
1. Security schemes are configured in Swagger
2. Controllers have `[Authorize]` attribute
3. Authentication middleware is registered: `app.UseAuthentication();`
4. JWT or API key is valid

### File Upload Not Showing

Check:
1. Endpoint has `[Consumes("multipart/form-data")]` attribute
2. Parameters use `IFormFile` or `List<IFormFile>`
3. Swagger is generating correct schema (type: string, format: binary)

### Endpoints Not Appearing

Verify:
1. Controllers are discovered: `builder.Services.AddControllers();`
2. Swagger is configured: `builder.Services.AddSwaggerGen();`
3. Routes are mapped: `app.MapControllers();`
4. API versioning filters are correct (if using versions)

---

## 🌟 Best Practices

### 1. Use Descriptive Summaries

```csharp
[HttpGet("{id}")]
[ProducesResponseType(typeof(Product), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public IActionResult GetProduct(int id)
{
    // Implementation
}
```

Add XML documentation:
```csharp
/// <summary>
/// Retrieves a specific product by ID
/// </summary>
/// <param name="id">The product identifier</param>
/// <returns>The product details</returns>
[HttpGet("{id}")]
public IActionResult GetProduct(int id)
{
    // Implementation
}
```

Enable XML comments in Swagger:
```csharp
builder.Services.AddSwaggerGen(c =>
{
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    c.IncludeXmlComments(xmlPath);
});
```

### 2. Organize with Tags

```csharp
[ApiController]
[Route("api/[controller]")]
[Tags("Products")] // Groups endpoints in sidebar
public class ProductsController : ControllerBase
{
    // Methods
}
```

### 3. Validate File Uploads

```csharp
[HttpPost("upload")]
[Consumes("multipart/form-data")]
public IActionResult UploadFile(IFormFile file)
{
    // Validate size
    if (file.Length > 10 * 1024 * 1024) // 10MB
        return BadRequest("File too large");
    
    // Validate type
    var allowedTypes = new[] { "image/jpeg", "image/png", "application/pdf" };
    if (!allowedTypes.Contains(file.ContentType))
        return BadRequest("Invalid file type");
    
    // Process file
    return Ok();
}
```

### 4. Use Response Types

```csharp
[HttpGet]
[ProducesResponseType(typeof(List<Product>), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public IActionResult GetProducts()
{
    // Implementation
}
```

### 5. Add Examples

```csharp
public class Product
{
    [Required]
    [SwaggerSchema("Product name", Example = "Laptop")]
    public string Name { get; set; }
    
    [SwaggerSchema("Product price", Example = 999.99)]
    public decimal Price { get; set; }
}
```

---

## 📖 Examples

Check out the included `SampleApi` project for complete examples of:

- ✅ Basic CRUD operations
- ✅ Authorization with Bearer tokens
- ✅ File uploads (single, multiple, with metadata)
- ✅ API versioning (v1, v2, beta)
- ✅ Search and filtering
- ✅ Error handling
- ✅ Request validation

Run the sample:
```bash
cd SampleApi
dotnet run
```

