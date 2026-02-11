using Microsoft.AspNetCore.Http;
using System.Net;
using System.Reflection;
using System.Text;

namespace SwaggerWithSwagg
{
    /// <summary>
    /// Middleware that serves the SwaggerWithSwagg UI
    /// </summary>
    public class SwaggerWithSwaggMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly SwaggerWithSwaggOptions _options;

        public SwaggerWithSwaggMiddleware(RequestDelegate next, SwaggerWithSwaggOptions options)
        {
            _next = next;
            _options = options;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value?.TrimEnd('/');
            var routePrefix = _options.RoutePrefix.TrimStart('/').TrimEnd('/');

            // Serve .js and .css files from wwwroot
            if (path?.StartsWith($"/{routePrefix}/", StringComparison.OrdinalIgnoreCase) == true)
            {
                var fileName = path.Substring($"/{routePrefix}/".Length);
                
                // Check if it's a .js or .css file
                if (fileName.EndsWith(".js", StringComparison.OrdinalIgnoreCase) || 
                    fileName.EndsWith(".css", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        // Convert file path to embedded resource name (replace / with . and handle nested folders)
                        var resourceName = $"{fileName}";
                        var content = GetEmbeddedResource(resourceName);
                        
                        // Set appropriate content type
                        context.Response.ContentType = fileName.EndsWith(".js", StringComparison.OrdinalIgnoreCase) 
                            ? "application/javascript;charset=utf-8" 
                            : "text/css;charset=utf-8";
                        
                        context.Response.StatusCode = (int)HttpStatusCode.OK;
                        await context.Response.WriteAsync(content, Encoding.UTF8);
                        return;
                    }
                    catch (FileNotFoundException)
                    {
                        // File not found, continue to next middleware
                    }
                }
            }

            // Check if the request is for the Swagger UI
            if (path?.Equals($"/{routePrefix}", StringComparison.OrdinalIgnoreCase) == true ||
                path?.Equals($"/{routePrefix}/index.html", StringComparison.OrdinalIgnoreCase) == true)
            {
                var html = GenerateHtml();
                context.Response.ContentType = "text/html;charset=utf-8";
                context.Response.StatusCode = (int)HttpStatusCode.OK;
                await context.Response.WriteAsync(html, Encoding.UTF8);
                return;
            }

            await _next(context);
        }

        private string GetEmbeddedResource(string resourceName)
        {
            var assembly = Assembly.GetExecutingAssembly();
            resourceName = resourceName.Replace("/", ".");
            using var stream = assembly.GetManifestResourceStream($"SwaggerWithSwagg.wwwroot.{resourceName}")
                                     ?? throw new FileNotFoundException($"Embedded resource '{resourceName}' not found.");
            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }

        private string GetVersionSelectorHtml()
        {
            if (_options.ApiVersions == null || _options.ApiVersions.Count == 0)
            {
                return string.Empty;
            }

            var currentEndpoint = _options.SwaggerEndpoint;
            var optionsHtml = new StringBuilder();
            
            foreach (var version in _options.ApiVersions)
            {
                var selected = version.Endpoint == currentEndpoint ? "selected" : "";
                var description = !string.IsNullOrEmpty(version.Description) ? $" - {version.Description}" : "";
                optionsHtml.AppendLine($"<option value=\"{version.Endpoint}\" {selected}>{version.Name}{description}</option>");
            }

            return $@"
            <div class=""version-selector"">
                <select id=""apiVersionSelector"" onchange=""switchApiVersion(this.value)"">
                    {optionsHtml}
                </select>
            </div>";
        }

        private string GenerateHtml()
        {
            _options.VersionSelectorString = GetVersionSelectorHtml();

            string html = GetEmbeddedResource("index-template.html");
            var props = _options.GetType()
                                .GetProperties(BindingFlags.Default | BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)
                                .Where(a => a.PropertyType != typeof(List<SwaggerVersion>));
            
            foreach (var prop in props)
            {
                var value = prop.GetValue(_options) ?? "";
                html = html.Replace($"[[{prop.Name}]]", value.ToString(), StringComparison.InvariantCultureIgnoreCase);
            }

            return html;
        }
    }
}
