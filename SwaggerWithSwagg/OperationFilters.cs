using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace SwaggerWithSwagg
{
    /// <summary>
    /// Operation filter that removes security requirements from endpoints marked with [AllowAnonymous]
    /// </summary>
    public class AllowAnonymousOperationFilter : IOperationFilter
    {
        /// <summary>
        /// Applies the filter to remove security from anonymous endpoints
        /// </summary>
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var allowAnonymous = context.ApiDescription.ActionDescriptor.EndpointMetadata
                .OfType<AllowAnonymousAttribute>()
                .Any();

            if (allowAnonymous)
            {
                operation.Security?.Clear();
            }
        }
    }

    /// <summary>
    /// Operation filter that keeps only application/json content type, removing duplicates like text/json
    /// </summary>
    public class SingleContentTypeOperationFilter : IOperationFilter
    {
        private readonly string _contentType;

        /// <summary>
        /// Creates a new instance with the default content type of application/json
        /// </summary>
        public SingleContentTypeOperationFilter() : this("application/json")
        {
        }

        /// <summary>
        /// Creates a new instance with a custom content type
        /// </summary>
        /// <param name="contentType">The content type to keep (e.g., "application/json")</param>
        public SingleContentTypeOperationFilter(string contentType)
        {
            _contentType = contentType;
        }

        /// <summary>
        /// Applies the filter to remove duplicate content types
        /// </summary>
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            // Handle request body content types
            if (operation.RequestBody?.Content != null && operation.RequestBody.Content.Count > 1)
            {
                // Keep only the specified content type if it exists
                if (operation.RequestBody.Content.ContainsKey(_contentType))
                {
                    var content = operation.RequestBody.Content[_contentType];
                    operation.RequestBody.Content.Clear();
                    operation.RequestBody.Content.Add(_contentType, content);
                }
            }

            // Handle response content types
            if (operation.Responses != null)
            {
                foreach (var response in operation.Responses.Values)
                {
                    if (response.Content != null && response.Content.Count > 1)
                    {
                        // Keep only the specified content type if it exists
                        if (response.Content.ContainsKey(_contentType))
                        {
                            var content = response.Content[_contentType];
                            response.Content.Clear();
                            response.Content.Add(_contentType, content);
                        }
                    }
                }
            }
        }
    }
}
