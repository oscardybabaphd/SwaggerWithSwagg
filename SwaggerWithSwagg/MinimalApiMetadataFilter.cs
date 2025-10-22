using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace SwaggerWithSwagg;

/// <summary>
/// Custom operation filter to extract Summary and Description from Minimal API endpoints
/// </summary>
internal class MinimalApiMetadataFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // Try to get the endpoint metadata
        var endpointMetadata = context.ApiDescription.ActionDescriptor.EndpointMetadata;
        
        if (endpointMetadata != null)
        {
#if NET7_0_OR_GREATER
            // Look for IEndpointSummaryMetadata (from WithSummary) - Available in .NET 7+
            var summaryMetadata = endpointMetadata.OfType<Microsoft.AspNetCore.Http.Metadata.IEndpointSummaryMetadata>().FirstOrDefault();
            if (summaryMetadata != null && !string.IsNullOrEmpty(summaryMetadata.Summary))
            {
                operation.Summary = summaryMetadata.Summary;
            }

            // Look for IEndpointDescriptionMetadata (from WithDescription) - Available in .NET 7+
            var descriptionMetadata = endpointMetadata.OfType<Microsoft.AspNetCore.Http.Metadata.IEndpointDescriptionMetadata>().FirstOrDefault();
            if (descriptionMetadata != null && !string.IsNullOrEmpty(descriptionMetadata.Description))
            {
                operation.Description = descriptionMetadata.Description;
            }
#endif
            // Note: .NET 6 users should use XML comments or ApiExplorerSettings for documentation
        }
    }
}
