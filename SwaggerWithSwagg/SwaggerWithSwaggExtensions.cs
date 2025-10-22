using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Swashbuckle.AspNetCore.SwaggerUI;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Reflection;

namespace SwaggerWithSwagg
{
    /// <summary>
    /// Extension methods for configuring SwaggerWithSwagg
    /// </summary>
    public static class SwaggerWithSwaggExtensions
    {
        /// <summary>
        /// Adds SwaggerWithSwagg services to the service collection
        /// </summary>
        public static IServiceCollection AddSwaggerWithSwagg(this IServiceCollection services)
        {
            return services;
        }

        /// <summary>
        /// Configures SwaggerGen with recommended settings for SwaggerWithSwagg,
        /// including XML comments, annotations, and Minimal API metadata support
        /// </summary>
        /// <param name="options">SwaggerGen options to configure</param>
        /// <param name="assembly">The assembly to extract XML comments from (defaults to calling assembly)</param>
        public static void ConfigureForSwaggerWithSwagg(this SwaggerGenOptions options, Assembly? assembly = null)
        {
            // Use calling assembly if not specified
            assembly ??= Assembly.GetCallingAssembly();

            // Include XML comments for better documentation
            var xmlFilename = $"{assembly.GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
            
            if (File.Exists(xmlPath))
            {
                options.IncludeXmlComments(xmlPath);
            }

            // Enable annotations to support additional Swagger features
            options.EnableAnnotations();

            // Add custom filter to extract Minimal API metadata (Summary and Description)
            options.OperationFilter<MinimalApiMetadataFilter>();
        }

        /// <summary>
        /// Configures SwaggerGen with common operation filters for SwaggerWithSwagg,
        /// including AllowAnonymous handling and single content-type filtering
        /// </summary>
        /// <param name="options">SwaggerGen options to configure</param>
        /// <param name="contentType">The content type to keep (default: application/json). Set to null to allow all content types.</param>
        public static void AddSwaggerWithSwaggFilters(this SwaggerGenOptions options, string? contentType = "application/json")
        {
            // Add filter to handle [AllowAnonymous] attribute
            options.OperationFilter<AllowAnonymousOperationFilter>();

            // Add filter to keep only one content type (if specified)
            if (!string.IsNullOrEmpty(contentType))
            {
                options.OperationFilter<SingleContentTypeOperationFilter>(contentType);
            }
        }


        /// <summary>
        /// Configures the application to use SwaggerWithSwagg UI
        /// </summary>
        public static IApplicationBuilder UseSwaggerWithSwagg(this IApplicationBuilder app, Action<SwaggerWithSwaggOptions>? setupAction = null)
        {
            var options = new SwaggerWithSwaggOptions();
            setupAction?.Invoke(options);

            // Use custom middleware to serve enhanced UI
            app.UseMiddleware<SwaggerWithSwaggMiddleware>(options);

            return app;
        }
    }

    /// <summary>
    /// Configuration options for SwaggerWithSwagg
    /// </summary>
    public class SwaggerWithSwaggOptions
    {
        /// <summary>
        /// The route prefix for accessing the Swagger UI. Default is "swagger"
        /// </summary>
        public string RoutePrefix { get; set; } = "swagger";

        /// <summary>
        /// The endpoint for the OpenAPI/Swagger JSON specification
        /// </summary>
        public string SwaggerEndpoint { get; set; } = "/swagger/v1/swagger.json";

        /// <summary>
        /// List of API versions to display in the version selector
        /// </summary>
        public List<SwaggerVersion> ApiVersions { get; set; } = new List<SwaggerVersion>();

        /// <summary>
        /// The title to display in the UI
        /// </summary>
        public string DocumentTitle { get; set; } = "API Documentation";

        /// <summary>
        /// Custom CSS for additional styling
        /// </summary>
        public string? CustomCss { get; set; }
    }

    /// <summary>
    /// Represents an API version configuration
    /// </summary>
    public class SwaggerVersion
    {
        /// <summary>
        /// The name/label of the version (e.g., "v1", "v2", "Beta")
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// The endpoint URL for this version's Swagger JSON
        /// </summary>
        public string Endpoint { get; set; } = string.Empty;

        /// <summary>
        /// Optional description of this version
        /// </summary>
        public string? Description { get; set; }
    }
}
