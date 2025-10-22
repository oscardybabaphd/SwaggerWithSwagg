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
                        var resourceName = $"SwaggerWithSwagg.wwwroot.{fileName.Replace("/", ".")}";
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
            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream == null)
            {
                throw new FileNotFoundException($"Embedded resource '{resourceName}' not found.");
            }
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
            return $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>{_options.DocumentTitle}</title>
    <link rel=""stylesheet"" href=""/{_options.RoutePrefix}/swagger-ui.min.css"" />
    <style>
        :root {{
            --orange: #FF6C37;
            --dark-bg: #212121;
            --sidebar-bg: #252525;
            --border-color: #3f3f3f;
            --hover-bg: #2f2f2f;
            --text-primary: #f5f5f5;
            --text-secondary: #a0a0a0;
            --sidebar-width: 320px;
            --bg-tertiary: #1a1a1a;
        }}

        [data-theme=""light""] {{
            --orange: #FF6C37;
            --dark-bg: #ffffff;
            --sidebar-bg: #f5f5f5;
            --border-color: #e0e0e0;
            --hover-bg: #ebebeb;
            --text-primary: #1a1a1a;
            --text-secondary: #666666;
            --bg-tertiary: #fafafa;
        }}

        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--dark-bg);
            color: var(--text-primary);
            margin: 0;
            padding: 0;
            overflow: hidden;
            height: 100vh;
            transition: background-color 0.3s ease, color 0.3s ease;
        }}

        /* Postman-like Header */
        .swagg-header {{
            background: var(--sidebar-bg);
            border-bottom: 1px solid var(--border-color);
            padding: 0 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 56px;
            width: 100%;
            box-sizing: border-box;
            position: sticky;
            top: 0;
            z-index: 1000;
        }}

        .swagg-header h1 {{
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--text-primary);
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }}

        .swagg-logo {{
            width: 28px;
            height: 28px;
            background: var(--orange);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 16px;
            flex-shrink: 0;
        }}

        .header-controls {{
            display: flex;
            align-items: center;
            gap: 16px;
            flex-shrink: 0;
        }}

        .version-selector {{
            position: relative;
        }}

        .version-selector select {{
            background: var(--dark-bg);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 6px 32px 6px 12px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            outline: none;
            appearance: none;
            min-width: 120px;
        }}

        .version-selector select:hover {{
            border-color: var(--orange);
        }}

        .version-selector::after {{
            content: '▼';
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
            pointer-events: none;
            font-size: 10px;
        }}

        .header-badge {{
            background: var(--orange);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}

        .auth-button {{
            background: var(--dark-bg);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 6px 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--text-primary);
            font-size: 13px;
            font-weight: 500;
            transition: all 0.3s ease;
        }}

        .auth-button:hover {{
            border-color: var(--orange);
            background: var(--hover-bg);
        }}

        .auth-button.authorized {{
            border-color: #4caf50;
            color: #4caf50;
        }}

        .auth-button svg {{
            width: 16px;
            height: 16px;
        }}

        .theme-toggle {{
            background: var(--dark-bg);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 6px 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--text-primary);
            font-size: 13px;
            transition: all 0.3s ease;
        }}

        .theme-toggle:hover {{
            border-color: var(--orange);
            background: var(--hover-bg);
        }}

        .theme-toggle svg {{
            width: 16px;
            height: 16px;
        }}

        .theme-icon {{
            display: flex;
            align-items: center;
            justify-content: center;
        }}

        /* Authorization Modal */
        .auth-modal {{
            display: none;
            position: fixed;
            z-index: 2000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            animation: fadeIn 0.2s ease;
        }}

        .auth-modal.active {{
            display: flex;
            align-items: center;
            justify-content: center;
        }}

        @keyframes fadeIn {{
            from {{ opacity: 0; }}
            to {{ opacity: 1; }}
        }}

        .auth-modal-content {{
            background: var(--sidebar-bg);
            border-radius: 8px;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
        }}

        @keyframes slideUp {{
            from {{ 
                opacity: 0;
                transform: translateY(20px);
            }}
            to {{ 
                opacity: 1;
                transform: translateY(0);
            }}
        }}

        .auth-modal-header {{
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .auth-modal-header h2 {{
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 10px;
        }}

        .auth-modal-close {{
            background: none;
            border: none;
            font-size: 28px;
            color: var(--text-secondary);
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s ease;
        }}

        .auth-modal-close:hover {{
            background: var(--hover-bg);
            color: var(--text-primary);
        }}

        .auth-modal-body {{
            padding: 24px;
            overflow-y: auto;
            flex: 1;
        }}

        .auth-modal-description {{
            color: var(--text-secondary);
            font-size: 13px;
            margin-bottom: 16px;
        }}

        .auth-scheme {{
            background: var(--dark-bg);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 16px;
        }}

        .auth-scheme-header {{
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
        }}

        .auth-scheme-name {{
            font-weight: 600;
            font-size: 14px;
            color: var(--text-primary);
        }}

        .auth-scheme-type {{
            background: var(--orange);
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }}

        .auth-scheme-description {{
            color: var(--text-secondary);
            font-size: 12px;
            margin-bottom: 12px;
            font-style: italic;
        }}

        .auth-input-group {{
            margin-bottom: 12px;
        }}

        .auth-input-label {{
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}

        .auth-input {{
            width: 100%;
            padding: 10px 12px;
            background: var(--sidebar-bg);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            color: var(--text-primary);
            font-size: 13px;
            font-family: 'Courier New', monospace;
            transition: all 0.2s ease;
            box-sizing: border-box;
        }}

        .auth-input:focus {{
            outline: none;
            border-color: var(--orange);
            box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.1);
        }}

        .auth-modal-footer {{
            padding: 16px 24px;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }}

        .auth-modal-button {{
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
        }}

        .auth-modal-button-primary {{
            background: var(--orange);
            color: white;
        }}

        .auth-modal-button-primary:hover {{
            background: #e65f00;
        }}

        .auth-modal-button-secondary {{
            background: var(--dark-bg);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
        }}

        .auth-modal-button-secondary:hover {{
            background: var(--hover-bg);
        }}

        .auth-modal-button-danger {{
            background: transparent;
            color: #f44336;
            border: 1px solid #f44336;
        }}

        .auth-modal-button-danger:hover {{
            background: rgba(244, 67, 54, 0.1);
        }}

        /* Layout Container */
        .swagg-container {{
            display: flex;
            height: calc(100vh - 56px);
        }}

        /* Left Sidebar - Collections */
        .swagg-sidebar-left {{
            width: var(--sidebar-width);
            background: var(--sidebar-bg);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            order: 1;
            flex-shrink: 0;
            transition: background-color 0.3s ease, border-color 0.3s ease;
        }}

        .sidebar-section {{
            border-bottom: 1px solid var(--border-color);
            transition: border-color 0.3s ease;
        }}

        /* API Info Card */
        .api-info-card {{
            background: var(--sidebar-bg);
            border-bottom: 2px solid var(--border-color);
            padding: 16px 20px;
            transition: background-color 0.3s ease, border-color 0.3s ease;
        }}

        .api-info-header {{
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            color: var(--orange);
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            cursor: pointer;
            user-select: none;
        }}

        .api-info-header:hover {{
            opacity: 0.8;
        }}

        .api-info-header svg {{
            flex-shrink: 0;
        }}

        .api-info-toggle {{
            margin-left: auto;
            transition: transform 0.3s ease;
        }}

        .api-info-card.collapsed .api-info-toggle {{
            transform: rotate(-90deg);
        }}

        .api-info-card.collapsed .api-info-header {{
            margin-bottom: 0;
        }}

        .api-info-content {{
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 500px;
            overflow: hidden;
            transition: max-height 0.3s ease, opacity 0.3s ease;
        }}

        .api-info-card.collapsed .api-info-content {{
            max-height: 0;
            opacity: 0;
        }}

        .api-info-row {{
            display: flex;
            flex-direction: column;
            gap: 4px;
        }}

        .api-info-label {{
            font-size: 11px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }}

        .api-info-value {{
            font-size: 13px;
            color: var(--text-primary);
            font-weight: 500;
        }}

        .api-info-desc {{
            font-size: 12px;
            color: var(--text-secondary);
            line-height: 1.5;
            font-style: italic;
        }}

        .sidebar-header {{
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--dark-bg);
            transition: background-color 0.3s ease, border-color 0.3s ease;
            gap: 16px;
        }}

        .sidebar-header h3 {{
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);
            transition: color 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
            flex-shrink: 0;
        }}

        .sidebar-header .version-selector {{
            margin: 0;
            font-size: 12px;
        }}

        .sidebar-header .version-selector select {{
            padding: 6px 10px;
            font-size: 12px;
        }}

        /* API Tree View */
        .api-tree {{
            list-style: none;
            padding: 0;
            margin: 0;
        }}

        .search-box {{
            padding: 12px 20px;
            background: var(--dark-bg);
            border-bottom: 1px solid var(--border-color);
        }}

        .search-box input {{
            width: 100%;
            padding: 8px 12px;
            background: var(--sidebar-bg);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            color: var(--text-primary);
            font-size: 13px;
            outline: none;
            transition: border-color 0.2s;
        }}

        .search-box input:focus {{
            border-color: var(--orange);
        }}

        .search-box input::placeholder {{
            color: var(--text-secondary);
        }}

        .api-folder {{
            border-bottom: 1px solid var(--border-color);
        }}

        .api-folder.hidden {{
            display: none;
        }}

        .folder-header {{
            padding: 12px 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            background: var(--sidebar-bg);
            transition: all 0.2s;
            user-select: none;
        }}

        .folder-header:hover {{
            background: var(--hover-bg);
        }}

        .folder-icon {{
            transition: transform 0.2s;
            color: var(--text-secondary);
            font-size: 14px;
        }}

        .folder-header.expanded .folder-icon {{
            transform: rotate(90deg);
        }}

        .folder-name {{
            font-weight: 600;
            font-size: 13px;
            color: var(--text-primary);
            flex: 1;
        }}

        .folder-count {{
            font-size: 11px;
            color: var(--text-secondary);
            background: var(--dark-bg);
            padding: 2px 8px;
            border-radius: 10px;
        }}

        .folder-endpoints {{
            display: none;
            background: var(--dark-bg);
        }}

        .folder-endpoints.expanded {{
            display: block;
        }}

        .endpoint-item {{
            padding: 10px 20px 10px 45px;
            cursor: pointer;
            transition: all 0.2s;
            border-left: 3px solid transparent;
            display: flex;
            align-items: center;
            gap: 10px;
        }}

        .endpoint-lock {{
            flex-shrink: 0;
            margin-right: 4px;
        }}

        .endpoint-lock.locked {{
            color: #4caf50;
        }}

        .endpoint-lock.unlocked {{
            color: var(--text-secondary);
            opacity: 0.6;
        }}

        .endpoint-item.requires-auth {{
            border-left-color: rgba(76, 175, 80, 0.3);
        }}

        .endpoint-item.requires-auth:hover {{
            border-left-color: #4caf50;
        }}

        .endpoint-item.hidden {{
            display: none;
        }}

        .endpoint-item:hover {{
            background: var(--hover-bg);
            border-left-color: var(--orange);
        }}

        .endpoint-item.requires-auth:hover {{
            background: var(--hover-bg);
            border-left-color: #4caf50;
        }}

        .endpoint-item.highlight {{
            background: rgba(255, 108, 55, 0.15);
        }}

        .endpoint-method {{
            font-weight: 700;
            font-size: 10px;
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            min-width: 50px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }}

        .endpoint-path {{
            font-size: 11px;
            color: var(--text-primary);
            font-family: 'Monaco', 'Consolas', monospace;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
        }}

        .method-get {{ background: #61affe; color: white; }}
        .method-post {{ background: #49cc90; color: white; }}
        .method-put {{ background: #fca130; color: white; }}
        .method-delete {{ background: #f93e3e; color: white; }}
        .method-patch {{ background: #50e3c2; color: white; }}
        .method-undefined {{ background: #6c757d; color: white; }}

        /* Main Content */
        .swagg-main {{
            flex: 1;
            overflow-y: auto;
            background: var(--dark-bg);
            order: 2;
        }}

        /* Swagger UI Dark Theme Customization */
        .swagger-ui {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 24px;
        }}

        .swagger-ui .topbar {{
            display: none;
        }}

        .swagger-ui .info {{
            margin: 0 0 30px;
            background: var(--sidebar-bg);
            padding: 24px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }}

        .swagger-ui .info .title {{
            color: var(--text-primary) !important;
            font-size: 32px !important;
        }}

        .swagger-ui .info p {{
            color: var(--text-secondary) !important;
        }}

        .swagger-ui .info a {{
            color: var(--orange) !important;
        }}

        .swagger-ui .scheme-container {{
            background: var(--sidebar-bg);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }}

        .swagger-ui .opblock-tag {{
            border-bottom: 1px solid var(--border-color);
            color: var(--text-primary) !important;
            font-size: 20px !important;
            padding: 16px 0;
            margin: 20px 0 10px 0;
        }}

        .swagger-ui .opblock {{
            border-radius: 8px;
            margin-bottom: 12px;
            border: 1px solid var(--border-color);
            background: var(--sidebar-bg);
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            transition: all 0.2s;
        }}

        .swagger-ui .opblock:hover {{
            box-shadow: 0 4px 12px rgba(255, 108, 55, 0.2);
            border-color: var(--orange);
        }}

        .swagger-ui .opblock .opblock-summary {{
            border-radius: 8px 8px 0 0;
            padding: 12px 20px;
        }}

        .swagger-ui .opblock.opblock-get .opblock-summary {{
            border-color: #61affe;
            background: rgba(97, 175, 254, 0.1);
        }}

        .swagger-ui .opblock.opblock-post .opblock-summary {{
            border-color: #49cc90;
            background: rgba(73, 204, 144, 0.1);
        }}

        .swagger-ui .opblock.opblock-put .opblock-summary {{
            border-color: #fca130;
            background: rgba(252, 161, 48, 0.1);
        }}

        .swagger-ui .opblock.opblock-delete .opblock-summary {{
            border-color: #f93e3e;
            background: rgba(249, 62, 62, 0.1);
        }}

        .swagger-ui .opblock-summary-method {{
            background: transparent !important;
            font-weight: 700 !important;
            font-size: 13px !important;
            padding: 6px 12px !important;
            border-radius: 4px !important;
            min-width: 70px;
            text-align: center;
        }}

        .swagger-ui .opblock-summary-path {{
            color: var(--text-primary) !important;
            font-family: 'Monaco', 'Consolas', monospace !important;
            font-size: 14px !important;
        }}

        .swagger-ui .opblock-description-wrapper,
        .swagger-ui .opblock-body {{
            background: var(--dark-bg);
            color: var(--text-primary);
        }}

        .swagger-ui .btn.execute {{
            background: var(--orange) !important;
            border: none !important;
            color: white !important;
            font-weight: 600 !important;
            padding: 12px 32px !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 13px !important;
        }}

        .swagger-ui .btn.execute:hover {{
            background: #e85d2a !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 108, 55, 0.4) !important;
        }}

        .swagger-ui .response-col_status {{
            color: var(--text-primary) !important;
        }}

        .swagger-ui .responses-inner {{
            padding: 20px;
            background: var(--sidebar-bg);
            border-radius: 6px;
            margin-top: 15px;
            border: 1px solid var(--border-color);
        }}

        .swagger-ui .response {{
            color: var(--text-primary) !important;
        }}

        .swagger-ui .highlight-code {{
            background: #1e1e1e !important;
            border-radius: 6px;
            padding: 15px;
        }}

        .swagger-ui .highlight-code > pre {{
            background: transparent !important;
            color: var(--text-primary) !important;
        }}

        .swagger-ui table thead tr th {{
            color: var(--text-primary) !important;
            border-bottom: 1px solid var(--border-color) !important;
        }}

        .swagger-ui table tbody tr td {{
            color: var(--text-secondary) !important;
            border-bottom: 1px solid var(--border-color) !important;
        }}

        .swagger-ui .parameter__name {{
            color: var(--text-primary) !important;
        }}

        .swagger-ui .parameter__type {{
            color: var(--orange) !important;
        }}

        .swagger-ui input[type=text],
        .swagger-ui textarea {{
            background: var(--dark-bg) !important;
            border: 1px solid var(--border-color) !important;
            color: var(--text-primary) !important;
        }}

        .swagger-ui select {{
            background: var(--dark-bg) !important;
            border: 1px solid var(--border-color) !important;
            color: var(--text-primary) !important;
        }}

        .toggle-sidebar {{
            position: fixed;
            right: var(--sidebar-width);
            top: 80px;
            background: var(--sidebar-bg);
            border: 1px solid var(--border-color);
            border-right: none;
            border-radius: 6px 0 0 6px;
            padding: 12px 6px;
            cursor: pointer;
            z-index: 999;
            transition: all 0.3s ease;
            color: var(--text-secondary);
        }}

        .toggle-sidebar:hover {{
            background: var(--hover-bg);
            color: var(--orange);
        }}

        .swagg-container.sidebar-hidden .swagg-sidebar {{
            transform: translateX(100%);
        }}

        .swagg-container.sidebar-hidden .toggle-sidebar {{
            right: 0;
        }}

        /* Empty State */
        .empty-state {{
            text-align: center;
            padding: 60px 20px;
            color: var(--text-secondary);
        }}

        .empty-state svg {{
            width: 48px;
            height: 48px;
            margin-bottom: 16px;
            opacity: 0.4;
            color: var(--text-secondary);
        }}

        .empty-state p {{
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 6px;
        }}

        .empty-state small {{
            font-size: 11px;
            opacity: 0.7;
        }}

        /* Custom Scrollbar */
        .swagg-sidebar-left::-webkit-scrollbar,
        .swagg-sidebar::-webkit-scrollbar,
        .swagg-main::-webkit-scrollbar {{
            width: 8px;
        }}

        .swagg-sidebar-left::-webkit-scrollbar-track,
        .swagg-sidebar::-webkit-scrollbar-track,
        .swagg-main::-webkit-scrollbar-track {{
            background: var(--dark-bg);
        }}

        .swagg-sidebar-left::-webkit-scrollbar-thumb,
        .swagg-sidebar::-webkit-scrollbar-thumb,
        .swagg-main::-webkit-scrollbar-thumb {{
            background: var(--border-color);
            border-radius: 4px;
        }}

        .swagg-sidebar-left::-webkit-scrollbar-thumb:hover,
        .swagg-sidebar::-webkit-scrollbar-thumb:hover,
        .swagg-main::-webkit-scrollbar-thumb:hover {{
            background: #555;
        }}

        /* Hide Swagger UI by default */
        #swagger-ui {{
            display: none !important;
        }}

        /* Custom Endpoint Detail View */
        #endpointDetail {{
            display: none;
            max-width: 1400px;
            margin: 0 auto;
            padding: 24px;
        }}

        #endpointDetail.active {{
            display: block;
        }}

        .detail-header {{
            background: var(--sidebar-bg);
            padding: 24px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            margin-bottom: 20px;
        }}

        .detail-method {{
            font-weight: 700;
            font-size: 14px;
            display: inline-block;
            padding: 8px 16px;
            border-radius: 6px;
            margin-right: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}

        .detail-path {{
            font-size: 18px;
            color: var(--text-primary);
            font-family: 'Monaco', 'Consolas', monospace;
            font-weight: 600;
            margin-left: 8px;
            word-break: break-all;
        }}

        .security-badge {{
            display: inline-block;
            background: #4caf50;
            color: white;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            margin-left: 8px;
            letter-spacing: 0.5px;
            cursor: help;
        }}

        .detail-summary {{
            color: var(--text-primary);
            font-size: 16px;
            font-weight: 600;
            margin-top: 16px;
            line-height: 1.6;
        }}

        .detail-description {{
            color: var(--text-secondary);
            font-size: 14px;
            margin-top: 12px;
            line-height: 1.6;
        }}

        .detail-section {{
            background: var(--sidebar-bg);
            padding: 24px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            margin-bottom: 20px;
        }}

        .detail-section h3 {{
            color: var(--text-primary);
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        }}

        .detail-section h4 {{
            color: var(--text-primary);
            font-size: 15px;
            font-weight: 600;
            margin-top: 20px;
            margin-bottom: 12px;
        }}

        .schema-block {{
            background: #1e1e1e;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 16px;
            margin-top: 12px;
            overflow-x: auto;
            max-height: 600px;
            overflow-y: auto;
        }}

        .schema-block pre {{
            margin: 0;
            color: var(--text-primary);
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 13px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-word;
        }}

        .schema-block::-webkit-scrollbar {{
            width: 8px;
            height: 8px;
        }}

        .schema-block::-webkit-scrollbar-track {{
            background: var(--dark-bg);
        }}

        .schema-block::-webkit-scrollbar-thumb {{
            background: var(--border-color);
            border-radius: 4px;
        }}

        .schema-block::-webkit-scrollbar-thumb:hover {{
            background: #555;
        }}

        /* Schema expandable sections */
        .schema-block [onclick] {{
            user-select: none;
        }}

        .schema-block [onclick]:hover {{
            text-decoration: underline;
            opacity: 0.8;
        }}

        .try-it-button {{
            background: var(--orange);
            border: none;
            color: white;
            font-weight: 600;
            padding: 14px 40px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-top: 20px;
        }}

        .try-it-button:hover {{
            background: #e85d2a;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 108, 55, 0.4);
        }}

        .try-it-button:active {{
            transform: translateY(0);
        }}

        /* Try It Out Panel */
        .try-it-overlay {{
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9998;
        }}

        .try-it-panel {{
            display: none;
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: 600px;
            max-width: 50vw;
            background: var(--sidebar-bg);
            border-left: 2px solid var(--border-color);
            z-index: 9999;
            box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            display: flex;
            flex-direction: column;
        }}

        .try-it-panel.open {{
            transform: translateX(0);
        }}

        .try-it-panel.maximized {{
            width: 100% !important;
            max-width: 100% !important;
            left: 0;
        }}

        .try-it-panel.maximized .try-it-panel-body {{
            flex-direction: row;
        }}

        .try-it-panel.maximized .try-it-panel-body > div:first-child {{
            flex: 1;
            max-width: 50%;
            border-right: 2px solid var(--border-color);
        }}

        .try-it-panel.maximized .try-it-request-section {{
            border-bottom: none;
            border-right: none;
        }}

        .try-it-panel.maximized .try-it-response-section {{
            max-width: 50%;
        }}

        .try-it-panel.minimized {{
            display: none;
        }}

        /* Minimized Tabs Bar */
        .minimized-tabs-bar {{
            position: fixed;
            bottom: 0;
            right: 0;
            left: var(--sidebar-width);
            background: var(--sidebar-bg);
            border-top: 2px solid var(--border-color);
            padding: 8px 16px;
            display: none;
            gap: 8px;
            align-items: center;
            z-index: 9997;
            overflow-x: auto;
            overflow-y: hidden;
            max-height: 60px;
        }}

        .minimized-tabs-bar.visible {{
            display: flex;
        }}

        .minimized-tab {{
            background: var(--dark-bg);
            border: 1px solid var(--border-color);
            border-radius: 6px 6px 0 0;
            padding: 8px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            min-width: 200px;
            max-width: 300px;
            position: relative;
        }}

        .minimized-tab:hover {{
            background: var(--hover-bg);
            border-color: var(--orange);
        }}

        .minimized-tab-method {{
            font-weight: 700;
            font-size: 10px;
            padding: 3px 8px;
            border-radius: 3px;
            min-width: 50px;
            text-align: center;
            text-transform: uppercase;
            flex-shrink: 0;
        }}

        .minimized-tab-path {{
            font-size: 11px;
            color: var(--text-primary);
            font-family: 'Monaco', 'Consolas', monospace;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
        }}

        .minimized-tab-close {{
            color: var(--text-secondary);
            font-size: 16px;
            line-height: 1;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 3px;
            transition: all 0.2s;
            flex-shrink: 0;
        }}

        .minimized-tab-close:hover {{
            background: rgba(244, 67, 54, 0.1);
            color: #f44336;
        }}

        .try-it-panel-header {{
            padding: 24px;
            border-bottom: 1px solid var(--border-color);
            flex-shrink: 0;
        }}

        .try-it-panel-body {{
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }}

        .try-it-request-section {{
            flex: 1;
            overflow-y: auto;
            padding: 0;
            border-bottom: 2px solid var(--border-color);
            display: flex;
            flex-direction: column;
        }}

        .try-it-request-content {{
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            padding-bottom: 12px;
        }}

        .try-it-request-actions {{
            padding: 16px 24px;
            background: var(--darker-bg);
            border-top: 1px solid var(--border-color);
            display: flex;
            gap: 12px;
            position: sticky;
            bottom: 0;
            z-index: 10;
        }}

        .try-it-response-section {{
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            background: var(--dark-bg);
        }}

        .try-it-execute-button {{
            padding: 10px 24px;
            background: linear-gradient(135deg, #ff6c37 0%, #ff9068 100%);
            border: none;
            border-radius: 6px;
            color: white;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }}

        .try-it-execute-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 108, 55, 0.4);
        }}

        .spinner {{
            border: 3px solid var(--border-color);
            border-top: 3px solid var(--orange);
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 8px;
        }}

        @keyframes spin {{
            0% {{ transform: rotate(0deg); }}
            100% {{ transform: rotate(360deg); }}
        }}

        .param-table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
        }}

        .param-table th {{
            background: var(--dark-bg);
            color: var(--text-primary);
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            border-bottom: 2px solid var(--border-color);
        }}

        .param-table td {{
            padding: 12px;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-secondary);
            font-size: 13px;
        }}

        .param-name {{
            color: var(--text-primary);
            font-family: 'Monaco', 'Consolas', monospace;
            font-weight: 600;
        }}

        .param-required {{
            color: #f93e3e;
            font-size: 11px;
            font-weight: 600;
            margin-left: 6px;
        }}

        .param-type {{
            color: var(--orange);
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 12px;
        }}

        /* Welcome Message */
        .welcome-message {{
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            min-height: 400px;
            color: var(--text-secondary);
            text-align: center;
            padding: 40px;
        }}

        .welcome-message svg {{
            width: 80px;
            height: 80px;
            margin-bottom: 24px;
            opacity: 0.3;
        }}

        .welcome-message h2 {{
            color: var(--text-primary);
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 12px;
        }}

        .welcome-message p {{
            font-size: 14px;
            margin-bottom: 8px;
            max-width: 500px;
        }}

        {(_options.CustomCss ?? "")}
    </style>
</head>
<body>
    <div class=""swagg-header"">
        <h1>
            <div class=""swagg-logo"">S</div>
            {_options.DocumentTitle}
        </h1>
        <div class=""header-controls"">
            {GetVersionSelectorHtml()}
            <button class=""auth-button"" onclick=""openAuthModal()"" title=""Authorization"" id=""authButton"">
                <svg xmlns=""http://www.w3.org/2000/svg"" width=""16"" height=""16"" viewBox=""0 0 24 24"" fill=""none"" stroke=""currentColor"" stroke-width=""2"">
                    <rect x=""3"" y=""11"" width=""18"" height=""11"" rx=""2"" ry=""2""></rect>
                    <path d=""M7 11V7a5 5 0 0 1 10 0v4""></path>
                </svg>
                <span>Authorize</span>
            </button>
            <button class=""theme-toggle"" onclick=""toggleTheme()"" title=""Toggle theme"">
                <span class=""theme-icon"" id=""themeIcon"">
                    <svg xmlns=""http://www.w3.org/2000/svg"" fill=""none"" viewBox=""0 0 24 24"" stroke=""currentColor"">
                        <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"" />
                    </svg>
                </span>
            </button>
            <div class=""header-badge"">
                SwaggerWithSwagg
            </div>
        </div>
    </div>

    <!-- Authorization Modal -->
    <div class=""auth-modal"" id=""authModal"">
        <div class=""auth-modal-content"">
            <div class=""auth-modal-header"">
                <h2>
                    <svg xmlns=""http://www.w3.org/2000/svg"" width=""20"" height=""20"" viewBox=""0 0 24 24"" fill=""none"" stroke=""currentColor"" stroke-width=""2"">
                        <rect x=""3"" y=""11"" width=""18"" height=""11"" rx=""2"" ry=""2""></rect>
                        <path d=""M7 11V7a5 5 0 0 1 10 0v4""></path>
                    </svg>
                    Available Authorizations
                </h2>
                <button class=""auth-modal-close"" onclick=""closeAuthModal()"">&times;</button>
            </div>
            <div class=""auth-modal-body"" id=""authModalBody"">
                <p class=""auth-modal-description"">Loading authentication schemes...</p>
            </div>
            <div class=""auth-modal-footer"">
                <button class=""auth-modal-button auth-modal-button-secondary"" onclick=""closeAuthModal()"">Cancel</button>
                <button class=""auth-modal-button auth-modal-button-primary"" onclick=""saveAuth()"">Authorize</button>
                <button class=""auth-modal-button auth-modal-button-danger"" onclick=""clearAuth()"">Logout</button>
            </div>
        </div>
    </div>

    <div class=""swagg-container"" id=""swaggContainer"">
        <!-- Left Sidebar - Collections -->
        <div class=""swagg-sidebar-left"" id=""swaggSidebarLeft"">
            
            <!-- API Info Card -->
            <div class=""api-info-card"" id=""apiInfoCard"">
                <div class=""api-info-header"" onclick=""toggleApiInfo()"">
                    <svg xmlns=""http://www.w3.org/2000/svg"" width=""16"" height=""16"" viewBox=""0 0 24 24"" fill=""none"" stroke=""currentColor"" stroke-width=""2"">
                        <circle cx=""12"" cy=""12"" r=""10""></circle>
                        <line x1=""12"" y1=""16"" x2=""12"" y2=""12""></line>
                        <line x1=""12"" y1=""8"" x2=""12.01"" y2=""8""></line>
                    </svg>
                    <span id=""apiInfoTitle"">API Information</span>
                    <svg class=""api-info-toggle"" id=""apiInfoToggle"" xmlns=""http://www.w3.org/2000/svg"" width=""14"" height=""14"" viewBox=""0 0 24 24"" fill=""none"" stroke=""currentColor"" stroke-width=""2"">
                        <polyline points=""6 9 12 15 18 9""></polyline>
                    </svg>
                </div>
                <div class=""api-info-content"" id=""apiInfoContent"">
                    <div class=""api-info-row"">
                        <span class=""api-info-label"">Version:</span>
                        <span class=""api-info-value"" id=""apiInfoVersion"">-</span>
                    </div>
                    <div class=""api-info-row"" id=""apiInfoDescRow"" style=""display: none;"">
                        <span class=""api-info-label"">Description:</span>
                        <span class=""api-info-value api-info-desc"" id=""apiInfoDesc"">-</span>
                    </div>
                    <div class=""api-info-row"" id=""apiInfoContactRow"" style=""display: none;"">
                        <span class=""api-info-label"">Contact:</span>
                        <span class=""api-info-value"" id=""apiInfoContact"">-</span>
                    </div>
                    <div class=""api-info-row"" id=""apiInfoSpecRow"" style=""display: none;"">
                        <span class=""api-info-label"">Specification:</span>
                        <span class=""api-info-value"">
                            <a href=""#"" id=""apiInfoSpecLink"" target=""_blank"" style=""color: var(--orange); text-decoration: none; font-weight: 600;"" 
                               onmouseover=""this.style.textDecoration='underline'"" 
                               onmouseout=""this.style.textDecoration='none'"">
                                📄 swagger.json
                            </a>
                        </span>
                    </div>
                </div>
            </div>
            
            <div class=""sidebar-header"">
                <h3>📁 Collections</h3>
            </div>
            <div class=""search-box"">
                <input type=""text"" id=""searchCollections"" placeholder=""Search endpoints..."" oninput=""searchCollections(this.value)"">
            </div>
            <ul class=""api-tree"" id=""apiTree"">
                <li class=""empty-state"">
                    <svg xmlns=""http://www.w3.org/2000/svg"" fill=""none"" viewBox=""0 0 24 24"" stroke=""currentColor"">
                        <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M4 6h16M4 12h16M4 18h16"" />
                    </svg>
                    <p>Loading API endpoints...</p>
                </li>
            </ul>
        </div>

        <div class=""swagg-main"">
            <div class=""welcome-message"" id=""welcomeMessage"">
                <svg xmlns=""http://www.w3.org/2000/svg"" fill=""none"" viewBox=""0 0 24 24"" stroke=""currentColor"">
                    <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"" />
                </svg>
                <h2>Welcome to SwaggerWithSwagg</h2>
                <p>Select an endpoint from the Collections sidebar to view its details</p>
                <p style=""opacity: 0.7; font-size: 12px;"">Response schemas, parameters, and execution options will appear here</p>
            </div>
            
            <div id=""endpointDetail"">
                <!-- Endpoint details will be dynamically loaded here -->
            </div>
            
            <div id=""swagger-ui""></div>
        </div>
    </div>

    <!-- Try It Out Panel -->
    <div id=""tryItOverlay"" class=""try-it-overlay"" onclick=""closeTryItPanel()""></div>
    <div id=""tryItPanel"" class=""try-it-panel""></div>
    
    <!-- Minimized Tabs Bar -->
    <div id=""minimizedTabsBar"" class=""minimized-tabs-bar""></div>

    <script src=""/{_options.RoutePrefix}/swagger-ui-bundle.min.js""></script>
    <script src=""/{_options.RoutePrefix}/swagger-ui-standalone-preset.min.js""></script>
    <script src=""/{_options.RoutePrefix}/swaggerwithswagg.js""></script>
    <script>
        // Theme Management
        const THEME_KEY = 'swaggerwithswagg-theme';
        
        // Sun icon for light mode
        const sunIcon = `<svg xmlns=""http://www.w3.org/2000/svg"" fill=""none"" viewBox=""0 0 24 24"" stroke=""currentColor"">
            <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"" />
        </svg>`;
        
        // Moon icon for dark mode
        const moonIcon = `<svg xmlns=""http://www.w3.org/2000/svg"" fill=""none"" viewBox=""0 0 24 24"" stroke=""currentColor"">
            <path stroke-linecap=""round"" stroke-linejoin=""round"" stroke-width=""2"" d=""M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"" />
        </svg>`;
        
        function toggleTheme() {{
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem(THEME_KEY, newTheme);
            
            // Update icon
            const themeIcon = document.getElementById('themeIcon');
            if (themeIcon) {{
                themeIcon.innerHTML = newTheme === 'light' ? moonIcon : sunIcon;
            }}
        }}
        
        // Load saved theme on page load
        function loadTheme() {{
            const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
            document.documentElement.setAttribute('data-theme', savedTheme);
            
            // Update icon
            const themeIcon = document.getElementById('themeIcon');
            if (themeIcon) {{
                themeIcon.innerHTML = savedTheme === 'light' ? moonIcon : sunIcon;
            }}
        }}
        
        // Load theme immediately
        loadTheme();

        // Toggle API Info Card
        const API_INFO_COLLAPSED_KEY = 'swaggerWithSwagg_apiInfoCollapsed';
        
        function toggleApiInfo() {{
            const card = document.getElementById('apiInfoCard');
            if (!card) return;
            
            const isCollapsed = card.classList.toggle('collapsed');
            localStorage.setItem(API_INFO_COLLAPSED_KEY, isCollapsed ? 'true' : 'false');
        }}
        
        // Load API info collapsed state
        function loadApiInfoState() {{
            const isCollapsed = localStorage.getItem(API_INFO_COLLAPSED_KEY) === 'true';
            const card = document.getElementById('apiInfoCard');
            if (card && isCollapsed) {{
                card.classList.add('collapsed');
            }}
        }}
        
        // Load state immediately
        loadApiInfoState();

        // Authorization Management
        const AUTH_KEY = 'swaggerWithSwagg_auth';
        let securitySchemes = {{}};
        
        function openAuthModal() {{
            const modal = document.getElementById('authModal');
            if (modal) {{
                modal.classList.add('active');
                loadAuthSchemes();
            }}
        }}
        
        function closeAuthModal() {{
            const modal = document.getElementById('authModal');
            if (modal) {{
                modal.classList.remove('active');
            }}
        }}
        
        async function loadAuthSchemes() {{
            try {{
                // Use cached swagger spec instead of fetching
                const spec = await getSwaggerSpec();
                
                securitySchemes = spec.components?.securitySchemes || {{}};
                renderAuthSchemes(securitySchemes);
            }} catch (e) {{
                console.error('Failed to load auth schemes:', e);
                document.getElementById('authModalBody').innerHTML = '<p class=""auth-modal-description"" style=""color: #f44336;"">Failed to load authentication schemes</p>';
            }}
        }}
        
        function renderAuthSchemes(schemes) {{
            const container = document.getElementById('authModalBody');
            
            if (Object.keys(schemes).length === 0) {{
                container.innerHTML = '<p class=""auth-modal-description"">No authentication schemes are configured for this API.</p>';
                return;
            }}
            
            const savedAuth = JSON.parse(localStorage.getItem(AUTH_KEY) || '{{}}');
            
            let html = '<p class=""auth-modal-description"">Enter your credentials to authorize API requests.</p>';
            
            Object.keys(schemes).forEach(schemeName => {{
                const scheme = schemes[schemeName];
                const type = scheme.type || 'unknown';
                const description = scheme.description || '';
                const savedValue = savedAuth[schemeName] || '';
                
                html += `
                    <div class=""auth-scheme"">
                        <div class=""auth-scheme-header"">
                            <span class=""auth-scheme-name"">${{escapeHtml(schemeName)}}</span>
                            <span class=""auth-scheme-type"">${{escapeHtml(type)}}</span>
                        </div>
                        ${{description ? `<div class=""auth-scheme-description"">${{escapeHtml(description)}}</div>` : ''}}
                `;
                
                if (type === 'http' && scheme.scheme === 'bearer') {{
                    html += `
                        <div class=""auth-input-group"">
                            <label class=""auth-input-label"">Bearer Token</label>
                            <input type=""text"" 
                                   class=""auth-input"" 
                                   id=""auth_${{schemeName}}"" 
                                   placeholder=""Enter bearer token""
                                   value=""${{escapeHtml(savedValue)}}"">
                        </div>
                    `;
                }} else if (type === 'apiKey') {{
                    const inLocation = scheme.in || 'header';
                    const paramName = scheme.name || 'api_key';
                    html += `
                        <div class=""auth-input-group"">
                            <label class=""auth-input-label"">${{escapeHtml(paramName)}} (${{inLocation}})</label>
                            <input type=""text"" 
                                   class=""auth-input"" 
                                   id=""auth_${{schemeName}}"" 
                                   placeholder=""Enter API key""
                                   value=""${{escapeHtml(savedValue)}}"">
                        </div>
                    `;
                }} else if (type === 'oauth2') {{
                    html += `
                        <div class=""auth-input-group"">
                            <label class=""auth-input-label"">Access Token</label>
                            <input type=""text"" 
                                   class=""auth-input"" 
                                   id=""auth_${{schemeName}}"" 
                                   placeholder=""Enter access token""
                                   value=""${{escapeHtml(savedValue)}}"">
                        </div>
                    `;
                }}
                
                html += '</div>';
            }});
            
            container.innerHTML = html;
        }}
        
        function saveAuth() {{
            const auth = {{}};
            let hasAuth = false;
            
            Object.keys(securitySchemes).forEach(schemeName => {{
                const input = document.getElementById(`auth_${{schemeName}}`);
                if (input && input.value.trim()) {{
                    auth[schemeName] = input.value.trim();
                    hasAuth = true;
                }}
            }});
            
            localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
            updateAuthButton(hasAuth);
            closeAuthModal();
            
            // Update Swagger UI authorization
            if (window.swaggerUI && hasAuth) {{
                const authData = {{}};
                Object.keys(auth).forEach(schemeName => {{
                    const scheme = securitySchemes[schemeName];
                    if (scheme.type === 'http' && scheme.scheme === 'bearer') {{
                        authData[schemeName] = {{
                            name: schemeName,
                            schema: {{ type: 'http', scheme: 'bearer' }},
                            value: auth[schemeName]
                        }};
                    }} else if (scheme.type === 'apiKey') {{
                        authData[schemeName] = auth[schemeName];
                    }}
                }});
                window.swaggerUI.preauthorizeApiKey(schemeName, auth[schemeName]);
            }}
        }}
        
        function clearAuth() {{
            localStorage.removeItem(AUTH_KEY);
            updateAuthButton(false);
            closeAuthModal();
            
            // Clear inputs
            Object.keys(securitySchemes).forEach(schemeName => {{
                const input = document.getElementById(`auth_${{schemeName}}`);
                if (input) input.value = '';
            }});
        }}
        
        function updateAuthButton(isAuthorized) {{
            const button = document.getElementById('authButton');
            if (button) {{
                if (isAuthorized) {{
                    button.classList.add('authorized');
                }} else {{
                    button.classList.remove('authorized');
                }}
            }}
        }}
        
        function escapeHtml(text) {{
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }}
        
        // Load auth state on page load
        function loadAuthState() {{
            const savedAuth = localStorage.getItem(AUTH_KEY);
            if (savedAuth) {{
                try {{
                    const auth = JSON.parse(savedAuth);
                    const hasAuth = Object.keys(auth).length > 0;
                    updateAuthButton(hasAuth);
                }} catch (e) {{
                    console.error('Failed to parse saved auth:', e);
                }}
            }}
        }}
        
        // Close modal when clicking outside
        document.addEventListener('click', function(e) {{
            const modal = document.getElementById('authModal');
            if (e.target === modal) {{
                closeAuthModal();
            }}
        }});
        
        // Load auth state immediately
        loadAuthState();

        // Switch API version
        function switchApiVersion(endpoint) {{
            initSwaggerWithSwagg({{
                swaggerEndpoint: endpoint
            }});
        }}

        // Initialize SwaggerWithSwagg
        initSwaggerWithSwagg({{
            swaggerEndpoint: '{_options.SwaggerEndpoint}'
        }});
    </script>
</body>
</html>";
        }
    }
}
